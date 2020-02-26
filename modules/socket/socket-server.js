const WebSocketServer = require('websocket').server;
const SocketHttpServer = require('./socket-http-server');
const ChartsService = require('./services/charts.service');
const EventListService = require('./services/event-list.service');
const TickService = require('./services/tick.service');
const TransferService = require('./services/transfer.service');
const socketClientService = require('./services/socket-client.service');
const ActiveTokenModel = require('../../database/models/active-token.model');
const UserModel = require('../../database/models/user.model');
const EventModel = require('../../database/models/event.model');
const EventCandidateModel = require('../../database/models/event-candidate.model');
const EventBetModel = require('../../database/models/event-bet.model');
const EventResultModel = require('../../database/models/event-result.model');
const ForexEventModel = require('../../database/models/forex-event.model');
const CandidateModel = require('../../database/models/candidate.model');
const BetModel = require('../../database/models/bet.model');
const ResultModel = require('../../database/models/result.model');
const ResultInfoModel = require('../../database/models/result-info.model');
const { biggestBetExcludingByEvent, calculateRiskAndEarningByEvent } = require('./helpers/calculate.helper');
const { formatEvent } = require('./helpers/format-event.helper');
const LoadEventsFromDB = require('./helpers/load-events-from-database.helper');
const BetService = require('./services/bat.service');
const { EVENT, FOREX_EVENT } = require('./constants/event-type.constants');
const _ = require('lodash');

require('dotenv').config();

const { SOCKET_PORT } = process.env;

class SocketServer {
  static get socketHttpServer() {
    return SocketHttpServer;
  }

  static get eventListService() {
    return EventListService;
  }

  static get isInitialed() {
    return Boolean(this.wsServer);
  }

  static init() {
    this.socketHttpServer.init();

    this.wsServer = new WebSocketServer({
      httpServer: this.socketHttpServer.server,
      autoAcceptConnections: false,
    });

    this.tickService = new TickService(this);
    this.transferService = new TransferService(this.wsServer);
  }

  static async run() {
    this.socketHttpServer.listen(SOCKET_PORT);
    this.tickService.run();
    this.wsServer.on('request', async req => {
      if (!this.originIsAllowed(req.origin)) {
        return req.reject();
      }

      const client = req.accept('gameserver', req.origin);

      Object.assign(client, socketClientService);

      const address = client.remoteAddress;
      const { path: requestToken } = req.resourceURL;

      const token = decodeURIComponent(requestToken.substr(1, requestToken.length - 1));
      const activeTokenModel = await ActiveTokenModel.findOne({ where: { token } });

      if (!activeTokenModel) {
        client.sendData({ type: 'disconnect', data: { reason: 'invalid__token' } });
        return client.close();
      }

      const userModel = await activeTokenModel.getUser();

      if (!userModel) {
        client.sendData({ type: 'disconnect', data: { reason: 'invalid_user' } });
        return client.close();
      }
      client.betting = {
        connection: {
          IPv4: address.substr(7, address.length - 7),
          token,
        },
        user: {},
      };

      const { account_type, balance, id, email, username, password } = userModel;
      const duplicateConnection = this.wsServer.connections.find(
        client => client.betting.user && client.betting.user.id === userModel.id,
      );

      if (duplicateConnection) {
        duplicateConnection.sendData({
          type: 'disconnect',
          data: { reason: 'duplicate' },
        });
        duplicateConnection.close();
        return client.close();
      }

      client.betting.user = {
        account_type,
        balance: balance,
        id,
        email,
        username,
        password,
        model: userModel,
        subscribed_to: {
          now: null,
          event_type: null,
          notifications: [],
        },
      };

      client.updateBalance();
      client.eventListUpdate();

      this.onMessage(client);
      this.onClose(client);
    });
    await LoadEventsFromDB();
  }

  static onMessage(client) {
    client.on('message', async msg => {
      if (msg.type === 'utf8') {
        const { type, data } = JSON.parse(msg.utf8Data);
        switch (type) {
          case 'keep_alive':
            client.sendData({ type: 'keep_alive' });

            break;
          case 'transfer':
            await this.handleTransfer(client, data);

            break;
          case 'unsubscribe_event':
            client.betting.user.subscribed_to.now = null;
            client.betting.user.subscribed_to.event_type = null;

            break;

          case 'subscribe_event':
            const event = this.eventListService.all.find(
              e => e.id === Number(data.id) && data.type === e.type,
            );

            if (!event) {
              return client.sendData({
                type: 'subscribe_event_rejected',
                data: { action: 'subscribe_event', reason: 'event_notfound' },
              });
            }

            client.betting.user.subscribed_to.now = event.id;
            client.betting.user.subscribed_to.event_type = event.type;

            if (event.type === FOREX_EVENT) {
              this.broadcastCharts(event, ChartsService.get(event.id));
            }

            client.sendData({
              type: 'subscription',
              data: formatEvent(event, client.betting.user.id, client.betting.user.account_type === 'ADMIN'),
            });

            event.type === FOREX_EVENT && this.broadcastCharts(event, ChartsService.get(event.id));

            break;

          case 'add_event':
            if (client.betting.user.account_type === 'ADMIN') {
              await this.handleAddEvent(data);
              this.broadcastEventList();
            }

            break;
          case 'add_forex_event':
            if (client.betting.user.account_type === 'ADMIN') {
              await this.handleAddForexEvent(data);
              this.broadcastEventList();
            }

            break;
          case 'update_results':
            client.betting.user.account_type == 'ADMIN' && (await this.handleUpdateResults(data));

            break;
          case 'update_event':
            client.betting.user.account_type == 'ADMIN' && (await this.handleUpdateEvent(data));

            break;
          case 'bet':
            await this.handleBet(client, data);

            break;
          case 'runtime_calculate_event':
            await this.handleRuntimeCalculationEvent(client, data);

            break;
          case 'modify_bet':
            await this.handleModifyBet(client, data);

            break;
        }
      }
    });
  }

  static onClose(client) {
    client.on('close', (reasonCode, description) => {
      console.log(
        new Date(),
        'CLOSE',
        client.betting.connection.IPv4,
        client.betting.user ? client.betting.user.email : '',
      );
    });
  }

  //TODO: move logic in the calculate helper
  static handleRuntimeCalculationEvent(client, data) {
    const { id: eventId, candidate: candidate_id, type } = data;
    const index = this.eventListService.all.findIndex(
      event => Number(event.id) === Number(eventId) && event.type === type,
    );
    const event = this.eventListService.get(index);
    const eventClone = _.cloneDeep(event);

    if (!event || !candidate_id) {
      return;
    }

    const amount = Number(data.amount);

    if (!amount) {
      return client.sendData({
        type: 'runtime_calculate_event',
        data: null,
      });
    }

    const newBet = {
      id: null,
      candidate_id,
      bet: amount,
      safe: amount,
      risk: 0,
      earning: 0,
    };

    eventClone.bets.push(newBet);

    const diffCandidates = eventClone.bets.some(bet => Number(bet.candidate_id) !== Number(candidate_id));

    if (diffCandidates) {
      const biggestBetExcluding = biggestBetExcludingByEvent(eventClone, candidate_id);

      eventClone.biggestRisk = Math.max(eventClone.biggestRisk, Math.min(amount, biggestBetExcluding));

      calculateRiskAndEarningByEvent(eventClone);
    }

    return client.sendData({
      type: 'runtime_calculate_event',
      data: { earning: newBet.earning, risk: newBet.risk, safe: newBet.safe },
    });
  }

  static async handleTransfer(client, data) {
    const { to, password, amount } = data;

    await this.transferService.transfer(client, to, password, amount);
  }

  // TODO: ADD VALIDATION FOR REQUEST DATA
  static async handleAddEvent(data, parent_id = null) {
    const {
      date,
      name,
      description,
      candidates: candidateList,
      commission,
      subEvents = [],
      mainName: main_name = null,
    } = data;
    const { start: start_date, end: end_date, bcd } = date;
    const now = new Date().getTime();
    const eventModel = await EventModel.create({
      name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      bcd,
      commission,
      parent_id,
      main_name,
    });
    const candidates = [];

    for (const candidate of candidateList) {
      const candidateModel =
        (await CandidateModel.findOne({ where: { name: candidate } })) ||
        (await CandidateModel.create({ name: candidate }));
      const eventCandidateCollection = await EventCandidateModel.create({
        event_type: EVENT,
        event_id: eventModel.id,
        candidate_id: candidateModel.id,
      });

      candidates.push({ id: candidateModel.id, name: candidateModel.name });
    }

    const _bcd = start_date + eventModel.bcd * 60 * 1000;
    const newEvent = {
      id: eventModel.id,
      infos: {
        name: name,
        mainName: main_name,
        desc: description,
      },
      status: {
        open: _bcd > now,
        started: now >= start_date,
        ended: now >= end_date,
        start: start_date,
        end: end_date,
        bcd: _bcd,
        period: bcd,
      },
      candidates,
      bets: [],
      results: [],
      biggestRisk: 0,
      type: EVENT,
      parent_id,
      commission: commission,
    };

    this.eventListService.create(newEvent);

    for (const subEvent of subEvents) {
      await this.handleAddEvent(subEvent, eventModel.id);
    }
  }

  // TODO: ADD VALIDATION FOR REQUEST DATA
  static async handleAddForexEvent(data, parent_id = null) {
    const {
      name,
      candidates: candidateList,
      date,
      commission,
      tick,
      currencies,
      description,
      refund,
      subEvents = [],
      mainName: main_name = null,
    } = data;
    const { start: start_date, end: end_date, update: update_date } = date;
    const now = new Date().getTime();
    const forexEventModel = await ForexEventModel.create({
      name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      update_date: new Date(update_date),
      bcd: Number(date.bcd),
      tick: Number(tick),
      currencies,
      commission,
      parent_id,
      refund,
      main_name,
    });
    const candidates = [];

    for (const candidate of candidateList) {
      const candidateModel =
        (await CandidateModel.findOne({ where: { name: candidate } })) ||
        (await CandidateModel.create({ name: candidate }));
      const eventCandidateCollection = await EventCandidateModel.create({
        event_type: FOREX_EVENT,
        event_id: forexEventModel.id,
        candidate_id: candidateModel.id,
      });

      candidates.push({ id: candidateModel.id, name: candidateModel.name });
    }

    const bcd = start_date + date.bcd * 60 * 1000;
    const newForexEvent = {
      id: forexEventModel.id,
      infos: {
        mainName: main_name,
        name: name,
        desc: description,
      },
      status: {
        open: bcd > now,
        started: now >= start_date,
        ended: now >= end_date,
        start: start_date,
        end: end_date,
        bcd,
        update: update_date,
        start_date,
        period: date.bcd,
      },
      tick,
      lastTick: tick,
      currencies,
      candidates,
      bets: [],
      parent_id,
      results: [],
      biggestRisk: 0,
      type: FOREX_EVENT,
      commission,
      refund,
    };

    this.eventListService.create(newForexEvent);

    for (const subEvent of subEvents) {
      await this.handleAddForexEvent(subEvent, forexEventModel.id);
    }
  }

  static async handleUpdateEvent(data) {
    const {
      date,
      name,
      description,
      candidates: candidateList,
      commission,
      type,
      id,
      tick,
      currencies,
      refund,
    } = data;
    const { start: start_date, end: end_date, bcd, update } = date;
    const now = new Date().getTime();
    const index = this.eventListService.all.findIndex(event => event.id === id && event.type === type);
    const event = this.eventListService.get(index);

    let updateData = {
      name,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      bcd,
      commission,
    };
    let eventModel = null;

    const _bcd = start_date + bcd * 60 * 1000;
    let updateEvent = {
      ...event,
      infos: {
        ...event.infos,
        name,
        desc: description,
      },
      status: {
        open: _bcd > now,
        started: now >= start_date,
        ended: now >= end_date,
        start: start_date,
        end: end_date,
        bcd: _bcd,
        period: bcd,
      },
      type,
      commission,
    };

    if (type === FOREX_EVENT) {
      updateData = {
        ...updateData,
        tick: Number(tick),
        currencies,
        refund,
      };
      updateEvent = {
        ...updateEvent,
        status: {
          ...updateEvent.status,
          update,
        },
        tick: Number(tick),
        currencies,
        refund,
      };
      eventModel = await ForexEventModel.findById(id);
    } else {
      const candidates = [];

      eventModel = await EventModel.findById(id);
      await eventModel.setCandidates(null);

      for (const candidate of candidateList) {
        const candidateModel =
          (await CandidateModel.findOne({ where: { name: candidate } })) ||
          (await CandidateModel.create({ name: candidate }));
        const eventCandidateCollection = await EventCandidateModel.create({
          event_type: type,
          event_id: eventModel.id,
          candidate_id: candidateModel.id,
        });

        candidates.push({ id: candidateModel.id, name: candidateModel.name });
      }

      updateEvent.candidates = candidates;
    }

    await eventModel.update(updateData);
    await this.eventListService.update(index, updateEvent);
    await this.broadcastEventList();
    await this.broadcastSubscription(updateEvent);
  }

  static async calculateGrantWithWinner(event, winner, refundType, event_type) {
    const winnerBets = event.bets.filter(({ candidate_id }) => candidate_id === winner);
    const winnerRisks = winnerBets.map(({ risk }) => risk);
    const biggestRiskForWinner = Math.max(...winnerRisks);
    const resultModel = await ResultModel.create({ candidate_id: winner });
    const resultInfoCollection = [];

    let totalRefund = 0;

    await EventResultModel.create({ event_type, event_id: event.id, result_id: resultModel.id });

    for (let bet of event.bets) {
      let to_grant = 0;
      let refund = 0;
      let resultInfoModel = null;
      to_grant += bet.safe;

      if (bet.risk > biggestRiskForWinner) {
        refundType === 'admin' && (totalRefund += bet.risk - biggestRiskForWinner);
        refundType === 'clients' && (to_grant += refund = bet.risk - biggestRiskForWinner);
      }

      if (bet.candidate_id === winner) {
        resultInfoModel = await ResultInfoModel.create({
          bet_id: bet.id,
          result_id: resultModel.id,
          refund: to_grant,
          win: bet.earning,
        });

        to_grant += bet.earning;
      } else {
        resultInfoModel = await ResultInfoModel.create({
          bet_id: bet.id,
          result_id: resultModel.id,
          refund: to_grant,
          lose: bet.bet - to_grant,
        });
      }

      resultInfoModel && resultInfoCollection.push(resultInfoModel);
      await this.grantWinnerMoney(bet.user_id, to_grant);
    }

    if (totalRefund && refundType === 'admin') {
      const account_type = 'ADMIN';

      for (let bet of event.bets) {
        const adminModel = await UserModel.findOne({ where: { account_type, id: bet.user_id } });

        if (adminModel) {
          await this.grantWinnerMoney(adminModel.id, totalRefund);

          const adminResultInfoModel = resultInfoCollection.find(model => model.bet_id === bet.id);

          if (adminResultInfoModel) {
            await adminResultInfoModel.update({ total_refund: totalRefund });
          }
        }
      }
    }

    event.results = resultInfoCollection.length > 0 ? resultInfoCollection : [winner];
  }

  static async calculateGrantWithoutWinner(event, event_type) {
    const resultModel = await ResultModel.create({ candidate_id: 0 });
    const resultInfoCollection = [];

    await EventResultModel.create({ event_type, event_id: event.id, result_id: resultModel.id });

    for (let { user_id, bet, id } of event.bets) {
      await this.grantWinnerMoney(user_id, bet);

      const resultInfoModel = await ResultInfoModel.create({
        bet_id: id,
        result_id: resultModel.id,
        refund: bet,
      });

      resultInfoCollection.push(resultInfoModel);
    }

    event.results = resultInfoCollection.length > 0 ? resultInfoCollection : [0];
  }

  static async handleUpdateResults(data) {
    const { results = [], id: eventId, refund: refundType = '', type } = data;
    const index = this.eventListService.all.findIndex(event => event.id === eventId && event.type === type);
    const event = this.eventListService.get(index);

    if (!event || results.length > event.candidates.length) {
      return void 0;
    }

    const winner = results.length === 0 ? 0 : Number(results[0]);

    if (winner) {
      await this.calculateGrantWithWinner(event, winner, refundType, type);
    } else {
      await this.calculateGrantWithoutWinner(event, type);
    }

    this.eventListService.update(index, event);

    this.broadcastAffectedBalance(event);
    this.unsubscribeUsers(event);
    this.broadcastEventList();
  }

  static async handleBet(client, data) {
    const { id: eventId, candidate, type } = data;
    const index = this.eventListService.all.findIndex(
      event => Number(event.id) === Number(eventId) && event.type === type,
    );
    const event = this.eventListService.get(index);

    if (!event) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'bet', reason: 'event_notfound' },
      });
    }

    if (!event.candidates.some(({ id }) => id === candidate)) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'bet', reason: 'candidate_notfound' },
      });
    }

    if (event.status.ended) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'bet', reason: 'event_over' },
      });
    }

    const {
      user: { id: userId, balance, model: userModel, username },
    } = client.betting;
    if (
      event.bets.some(
        ({ user_id, candidate_id }) =>
          Number(user_id) === Number(userId) && Number(candidate_id) === Number(candidate),
      )
    ) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'bet', reason: 'already_bet_on_candidate' },
      });
    }

    const amount = Number(data.amount);

    if (balance < amount && amount <= 0) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'bet', reason: 'balance_too_low' },
      });
    }

    await this.newBet(index, userId, amount, candidate, username, null, type);
    await userModel.update({ balance: (client.betting.user.balance -= data.amount) });
    await BetService.updateByEvent(this.eventListService.get(index));

    client.sendData({ type: 'bet_accepted', data: { action: 'place_bet' } });
    client.updateBalance();
  }

  static async handleModifyBet(client, data) {
    const { event: eventId, candidate, id: betId, type } = data;
    const eventIndex = this.eventListService.all.findIndex(
      event => event.id === eventId && event.type === type,
    );
    const event = this.eventListService.get(eventIndex);

    if (!event) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'event_notfound' },
      });
    }

    if (!event.candidates.some(({ id }) => id === candidate)) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'candidate_notfound' },
      });
    }

    const betIndex = event.bets.findIndex(({ id }) => id === betId);
    const findBet = event.bets[betIndex];

    if (!findBet) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'bet_notfound' },
      });
    }

    const {
      user: { id: userId, balance, model: userModel, username },
    } = client.betting;

    if (findBet.candidate_id !== data.candidate && findBet.user_id !== userId) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'illegal_operation' },
      });
    }

    if (event.status.ended) {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'event_over' },
      });
    }

    const amount = Number(data.amount);

    const modifyBet = async action => {
      await userModel.update({
        balance: (client.betting.user.balance -= diff),
      });
      await BetModel.update({ amount }, { where: { id: betId } });

      event.bets[betIndex].bet += diff;

      const cloneBets = _.cloneDeep(event.bets);

      event.bets = [];
      event.biggestRisk = 0;

      await cloneBets.forEach(({ user_id, bet, candidate_id, username, id }) =>
        this.newBet(eventIndex, user_id, bet, candidate_id, username, id),
      );
      await BetService.updateByEvent(this.eventListService.get(eventIndex));

      this.broadcastSubscription(this.eventListService.get(eventIndex));
      client.sendData({ type: 'bet_accepted', data: { action } });
    };

    const diff = amount - findBet.bet;

    if (amount >= 0 && diff <= 0) {
      if (!event.status.open) {
        return client.sendData({
          type: 'bet_rejected',
          data: { action: 'modify', reason: 'event_closed' },
        });
      }

      if (amount === 0) {
        await userModel.update({
          balance: (client.betting.user.balance += findBet.bet),
        });
        await BetModel.destroy({ where: { id: betId } });
        await EventBetModel.destroy({ where: { bet_id: betId, event_id: event.id, event_type: type } });

        const cloneBets = _.cloneDeep(event.bets);
        cloneBets.splice(betIndex, 1);

        event.bets = [];
        event.biggestRisk = 0;

        await cloneBets.forEach(({ user_id, bet, candidate_id, username, id }) =>
          this.newBet(eventIndex, user_id, bet, candidate_id, username, id),
        );
        await BetService.updateByEvent(this.eventListService.get(eventIndex));

        this.broadcastSubscription(this.eventListService.get(eventIndex));
        client.sendData({ type: 'bet_accepted', data: { action: 'remove_bet' } });
      } else {
        await modifyBet('lower_bet');
      }
    } else if (diff > 0) {
      if (diff <= balance) {
        await modifyBet('raise_bet');
      } else {
        return client.sendData({
          type: 'bet_rejected',
          data: { action: 'modify', reason: 'balance_too_low' },
        });
      }
    } else {
      return client.sendData({
        type: 'bet_rejected',
        data: { action: 'modify', reason: 'illegal_operation' },
      });
    }

    client.updateBalance();
  }

  static unsubscribeUsers(event) {
    const { connections } = this.wsServer;
    connections.forEach(client => {
      const {
        user: {
          subscribed_to: { now },
        },
      } = client.betting;
      now === event.id && this.unsubscribe(client);
    });
  }

  static unsubscribe(client) {
    client.sendData({ type: 'unsubscribed' });
    client.betting.user.subscribed_to.now = 0;
  }

  static unsubscribeUsersWithoutBets(event) {
    const { connections } = this.wsServer;
    connections.forEach(client => {
      if (
        client.betting.user.subscribed_to.now === event.id &&
        event.bets.filter(e => e.user_id === client.betting.user.id).length === 0 &&
        client.betting.user.account_type !== 'ADMIN'
      ) {
        this.unsubscribe(client);
      }
    });
  }

  static originIsAllowed(origin) {
    // return origin === 'http://betting.reddev2.com';
    return true;
  }

  static async newBet(index, user_id, amount, candidate_id, username, _bid = null, event_type = null) {
    const event = this.eventListService.get(index);

    if (_bid) {
      event.bets.push({
        id: _bid,
        user_id,
        username,
        candidate_id,
        bet: amount,
        safe: amount,
        risk: 0,
        earning: 0,
      });

      const diffCandidates = event.bets.some(bet => Number(bet.candidate_id) !== Number(candidate_id));

      if (diffCandidates) {
        const biggestBetExcluding = biggestBetExcludingByEvent(event, candidate_id);
        event.biggestRisk = Math.max(event.biggestRisk, Math.min(amount, biggestBetExcluding));

        await calculateRiskAndEarningByEvent(event);
        await this.eventListService.update(index, event);
      }

      return void 0;
    }

    const betModel = await BetModel.create({
      user_id,
      candidate_id,
      amount,
    });

    await EventBetModel.create({ event_type, bet_id: betModel.id, event_id: event.id });

    await this.newBet(index, user_id, amount, candidate_id, username, betModel.id);
    this.broadcastSubscription(event);
  }

  static async grantWinnerMoney(user_id, earning = 0) {
    if (!earning) {
      return;
    }

    const userModel = await UserModel.findById(user_id);

    if (!userModel) {
      return;
    }

    await userModel.update({ balance: (userModel.balance += earning) });

    const { connections } = this.wsServer;
    const client = connections.find(
      ({
        betting: {
          user: { id },
        },
      }) => id === userModel.id,
    );

    if (!client) {
      return;
    }

    client.betting.user.balance += earning;
    client.updateBalance();
  }

  static broadcastSubscription(event) {
    this.wsServer.connections.forEach(client => {
      if (Number(client.betting.user.subscribed_to.now) === Number(event.id)) {
        client.sendData({
          type: 'subscription_update',
          data: formatEvent(event, client.betting.user.id, client.betting.user.account_type === 'ADMIN'),
        });
      }
    });
  }

  static broadcastEventList() {
    this.wsServer.connections.forEach(client => client.eventListUpdate());
  }

  static broadcastCharts(event, chart = []) {
    const { connections } = this.wsServer;
    const prices = chart.map(({ price }) => price);
    const maxPrice = Math.max(0, ...prices);
    const minPrice = Math.min(...prices);

    connections.forEach(client => {
      const {
        betting: {
          user: {
            subscribed_to: { now, event_type },
          },
        },
      } = client;

      now === event.id &&
        event_type === event.type &&
        client.sendData({
          type: 'update_chart',
          data: { tick: Number(event.tick), data: chart || [], maxPrice, minPrice },
        });
    });
  }

  static broadcastAffectedBalance(event) {
    const { bets } = event;
    const { connections } = this.wsServer;

    connections.forEach(client => {
      const {
        betting: {
          user: { id: clientUserId },
        },
      } = client;
      bets.some(({ user_id: betUserId }) => betUserId === clientUserId) && client.updateBalance();
    });
  }
}

module.exports = SocketServer;
