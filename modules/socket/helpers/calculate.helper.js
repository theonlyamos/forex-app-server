const EventListService = require('../services/event-list.service');

const biggestBetExcludingByEvent = (event, candidate_id) => {
  const { bets } = event;
  let max = 0;

  bets
    .slice(0, -1)
    .forEach(
      ({ candidate_id: betCandidateId, bet }) =>
        (max = candidate_id !== betCandidateId && bet > max ? bet : max),
    );

  return max;
};

const biggestBetExcluding = (index, candidate_id) =>
  biggestBetExcludingByEvent(EventListService.get(index), candidate_id);

const calculateRiskAndEarningByEvent = event => {
  event.bets.map(item => {
    item.safe = item.bet > event.biggestRisk ? item.bet - event.biggestRisk : 0;
    item.risk = item.bet > event.biggestRisk ? event.biggestRisk : item.bet;

    return item;
  });

  event.bets.map(bet => {
    bet.earning = estimatedEarningForCandidate(bet.risk, event, bet.candidate_id);

    return bet;
  });
};

const calculateRiskAndEarning = index => {
  const event = EventListService.get(index);

  calculateRiskAndEarningByEvent(event);
  EventListService.update(index, event);
};

const estimatedEarningForCandidate = (betRisk, event, candidate_id) => {
  let totalRiskForCandidate = 0;
  let biggestRiskForCandidate = 0;
  let totalRisk = 0;
  let totalRefunds = 0;

  event.bets.forEach(bet => {
    if (Number(bet.candidate_id) === Number(candidate_id)) {
      totalRiskForCandidate += bet.risk;
      bet.risk > biggestRiskForCandidate && (biggestRiskForCandidate = bet.risk);
    }

    totalRisk += bet.risk;
  });

  event.bets.forEach(bet => {
    if (Number(bet.candidate_id) !== Number(candidate_id)) {
      bet.risk > biggestRiskForCandidate && (totalRefunds += bet.risk - biggestRiskForCandidate);
    }
  });

  return betRisk / totalRiskForCandidate * (totalRisk - totalRefunds) * (1 - event.commission);
};

module.exports = {
  biggestBetExcludingByEvent,
  biggestBetExcluding,
  calculateRiskAndEarningByEvent,
  calculateRiskAndEarning,
  estimatedEarningForCandidate,
};
