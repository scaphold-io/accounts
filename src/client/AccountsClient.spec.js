import { Map } from 'immutable';
import '../common/mockLocalStorage';
import Accounts from './AccountsClient';

const loggedInUser = {
  user: {
    id: '123',
    username: 'test',
    email: 'test@test.com',
  },
  session: {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  },
};

describe('Accounts', () => {
  describe('config', () => {
    it('requires a transport', () => {
      try {
        Accounts.config();
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('A REST or GraphQL transport is required');
      }
    });
    it('sets the transport', () => {
      const transport = {};
      Accounts.config({}, transport);
      expect(Accounts.instance.transport).toEqual(transport);
    });
  });
  describe('createUser', () => {
    it('requires user object', async () => {
      Accounts.config({}, {
        createUser: Promise.resolve(),
      });
      try {
        await Accounts.createUser();
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Unrecognized options for create user request [400]');
      }
    });
    it('requires password', async () => {
      Accounts.config({}, {
        createUser: Promise.resolve(),
      });
      try {
        await Accounts.createUser({
          password: null,
        });
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Password is required');
      }
    });
    it('requires username or an email', async () => {
      Accounts.config({}, {
        createUser: Promise.resolve(),
      });
      try {
        await Accounts.createUser({
          password: '123456',
          username: '',
          email: '',
        });
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Username or Email is required');
      }
    });
    it('calls callback on succesfull user creation', async () => {
      const callback = jest.fn();
      const transport = {
        createUser: () => Promise.resolve(true),
      };
      Accounts.config({}, transport);
      await Accounts.createUser({
        password: '123456',
        username: 'user',
      }, callback);

      expect(callback.mock.calls.length).toEqual(1);
    });
    it('calls callback on failure with error message', async () => {
      const transport = {
        createUser: () => Promise.reject('error message'),
      };

      Accounts.config({}, transport);

      const callback = jest.fn();

      try {
        await Accounts.createUser({
          password: '123456',
          username: 'user',
        }, callback);
        throw new Error();
      } catch (err) {
        expect(callback.mock.calls.length).toEqual(1);
        expect(callback.mock.calls[0][0]).toEqual('error message');
      }
    });
    it('calls login function with user id and password of created user', async () => {
      const transport = {
        createUser: () => Promise.resolve('123'),
      };
      Accounts.config({}, transport);

      Accounts.instance.loginWithPassword = jest.fn(() => Accounts.instance.loginWithPassword);

      await Accounts.createUser({
        password: '123456',
        username: 'user',
      });

      expect(Accounts.instance.loginWithPassword.mock.calls[0][0]).toEqual({ id: '123' });
      expect(Accounts.instance.loginWithPassword.mock.calls[0][1]).toEqual('123456');
    });
  });
  describe('loginWithPassword', () => {
    it('throws error if password is undefined', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(),
      };
      Accounts.config({}, transport);
      try {
        await Accounts.loginWithPassword();
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Unrecognized options for login request [400]');
      }
    });
    it('throws error if user is undefined', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(),
      };
      Accounts.config({}, transport);
      try {
        await Accounts.loginWithPassword();
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Unrecognized options for login request [400]');
      }
    });
    it('throws error user is not a string or is an empty object', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(),
      };
      Accounts.config({}, transport);
      try {
        await Accounts.loginWithPassword({}, 'password');
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Match failed [400]');
      }
    });
    it('throws error password is not a string', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(),
      };
      Accounts.config({}, transport);
      try {
        await Accounts.loginWithPassword({ user: 'username' }, {});
        throw new Error();
      } catch (err) {
        const { message } = err.serialize();
        expect(message).toEqual('Match failed [400]');
      }
    });
    it('calls callback on successful login', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(loggedInUser),
      };
      Accounts.config({}, transport);
      const callback = jest.fn();
      await Accounts.loginWithPassword('username', 'password', callback);
      expect(callback.mock.calls.length).toEqual(1);
    });
    it('calls transport', async () => {
      const loginWithPassword = jest.fn();
      const transport = {
        loginWithPassword,
      };
      Accounts.config({}, transport);
      await Accounts.loginWithPassword('username', 'password');
      expect(loginWithPassword.mock.calls[0][0]).toEqual('username');
      expect(loginWithPassword.mock.calls[0][1]).toEqual('password');
      expect(loginWithPassword.mock.calls.length).toEqual(1);
    });
    it('calls callback with error on failed login', async () => {
      const transport = {
        loginWithPassword: () => Promise.reject('error'),
      };
      Accounts.config({}, transport);
      const callback = jest.fn();
      try {
        await Accounts.loginWithPassword('username', 'password', callback);
        throw new Error();
      } catch (err) {
        expect(callback.mock.calls.length).toEqual(1);
        expect(callback.mock.calls[0][0]).toEqual('error');
      }
    });
    it('stores tokens in local storage', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(loggedInUser),
      };
      Accounts.config({}, transport);
      await Accounts.loginWithPassword('username', 'password');
      expect(localStorage.getItem('accounts:accessToken')).toEqual('accessToken');
      expect(localStorage.getItem('accounts:refreshToken')).toEqual('refreshToken');
    });
    it('stores user in redux', async () => {
      const transport = {
        loginWithPassword: () => Promise.resolve(loggedInUser),
      };
      Accounts.config({}, transport);
      await Accounts.loginWithPassword('username', 'password');
      expect(Accounts.instance.getState().get('user')).toEqual(Map({
        ...loggedInUser.user,
      }));
    });
  });
});
