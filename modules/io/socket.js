const express = require('express');
const server = require('http').createServer(express);
const io = require('socket.io')(server);
const JWTService = require('../../services/jwt.service');
const UserModel = require('../../database/models/user.model');
const ActiveTokenModel = require('../../database/models/active-token.model');

class SocketIO {
	/**
	* @description This method runs socket-io.
	* @return {void}
	*/
  static async run() {
  	const { IO_PORT } = process.env;
  	io.on('connection', socket => {      
      socket.on('processBalance', data => {
        if(data){
          io.sockets.emit('updateBalance', data);
        }
      });
      socket.on('transferHistories', data => {
        if(data){
          io.sockets.emit('updateTransferHistories', data);
        }
      });
      socket.on('manageFundsHistories', data => {
        if(data){
          io.sockets.emit('updateFundsHistories', data);
        }
      });
      socket.on('processUser', data => {
        if(data){
          io.sockets.emit('updateUserStatus', data);
        }
      });
      socket.on('addPayments', data => {
        if(data){
          io.sockets.emit('updatePayments', data);
        }
      });
      socket.on('updateListUsers', data => {
        if(data){
          io.sockets.emit('updateUsers', data);
        }
      });
      socket.on('accessUser', async data => {
        let token_data = await ActiveTokenModel.findOne({ where: { token: data.token } });
        let admin = await UserModel.findOne({ where: { id: token_data.user_id } });
        if(admin.account_type != 'ADMIN'){
          return io.sockets.emit('updateAccessUser', { 'error' : 'You are not allow to do this action!' });
        }
        let admin_token = data.token;

        let user_access = await UserModel.findOne({ where: { id: data.user.id } });
        let user_access_token = await ActiveTokenModel.findOne({ where: { user_id: user_access.id } });

        if(user_access_token && user_access_token.token){
          user_access_token = user_access_token.token
        }else{
          user_access_token = JWTService.generateTokenByUser(user_access);
          ActiveTokenModel.create({ token: user_access_token, user_id: user_access.id });
        }

        io.sockets.emit('updateAccessUser', { 'message' : 'Access success!', 'data' : { user_access_token, admin_token } });
      });
      socket.on('updateListAffiliates', data => {
        if(data){
          io.sockets.emit('updateAffiliates', data);
        }
      });
    })
    server.listen(IO_PORT);
  }
}
module.exports = SocketIO;