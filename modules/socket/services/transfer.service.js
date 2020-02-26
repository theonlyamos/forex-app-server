const TransferModel = require('../../../database/models/transfer.model');
const UserModel = require('../../../database/models/user.model');
const bcrypt = require('bcryptjs');

class TransferService {
  constructor(wssServer) {
    this.wssServer = wssServer;
  }

  async transfer(client, username, password, amount = 0) {
    const { user } = client.betting;

    if (amount <= 0) {
      return client.sendData({
        type: 'transfer_rejected',
        data: { reason: 'illegal_operation' },
      });
    }

    if (amount >= user.balance) {
      return client.sendData({
        type: 'transfer_rejected',
        data: { reason: 'balance_too_low' },
      });
    }

    if (username === user.username) {
      return client.sendData({
        type: 'transfer_rejected',
        data: { reason: 'its_yourself' },
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return client.sendData({
        type: 'transfer_rejected',
        data: { reason: 'invalid_password' },
      });
    }

    const toUserModel = await UserModel.findOne({ where: { username } });

    if (!toUserModel) {
      return client.sendData({
        type: 'transfer_rejected',
        data: { reason: 'username_notfound' },
      });
    }

    const transfer_date = new Date().getTime() / 1000;
    await TransferModel.create({
      amount,
      to_uid: toUserModel.id,
      from_uid: user.id,
      transfer_date,
    });

    await user.model.update({ balance: (user.balance -= amount) });
    await toUserModel.update({ balance: (toUserModel.balance += amount) });

    const toUserConnection = this.wssServer.connections.find(
      ({
        betting: {
          user: { id },
        },
      }) => id === toUserModel.id,
    );

    if (toUserConnection) {
      toUserConnection.betting.user.balance = toUserModel.balance;
      toUserConnection.updateBalance();
    }

    client.sendData({ type: 'transfer_accepted' });
    client.updateBalance();
  }
}

module.exports = TransferService;
