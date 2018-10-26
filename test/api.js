'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const Api = require('../lib/api');


describe('Api', () => {

  describe('getTicket()', () => {
    let api;

    before(() => {
      api = new Api();
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should be a function', () => {
      expect(api.getTicket).to.be.a('function');
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns(Promise.resolve('{ "issue": { "id": 17 } }'));
      return api.getTicket(17)
        .then(_ => {
          expect(_).to.eql({ id: 17 });
          expect(api.sendRequest).to.have.been.calledWith('GET', '/issues/17.json');
        });
    });
  });

  describe('updateTicket()', () => {
    let api;

    before(() => {
      api = new Api();
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should be a function', () => {
      expect(api.updateTicket).to.be.a('function');
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns('hier');
      expect(api.updateTicket(17, 'daten')).to.equal('hier');
      expect(api.sendRequest).to.have.been.calledWith('PUT', '/issues/17.json', 'daten');
    });
  });

  describe('logTime()', () => {
    let api;

    before(() => {
      api = new Api();
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should be a function', () => {
      expect(api.logTime).to.be.a('function');
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns('hier');
      expect(api.logTime(17, 3.45, 678)).to.equal('hier');
      const daten = {
        time_entry: {
          issue_id: 17,
          hours: 3.45,
          activity_id: 678
        }
      };
      expect(api.sendRequest).to.have.been.calledWith('POST', '/time_entries.json', daten);
    });
  });

  describe('sendRequest()', () => {
    let api;

    before(() => {
      api = new Api();
    });
    
    it('should be a function', () => {
      expect(api.sendRequest).to.be.a('function');
    });

  });

});
