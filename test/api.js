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
      api = new Api({ https: true });
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
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

  describe('getIssues()', () => {
    let api;

    before(() => {
      api = new Api({ https: true, project_id: 17 });
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns(Promise.resolve('{ "issues": [ { "id": 1 }, { "id": 2 } ] }'));
      return api.getIssues()
        .then(_ => {
          expect(_).to.eql([{ id: 1 }, { id: 2 }]);
          expect(api.sendRequest).to.have.been.calledWith('GET', '/issues.json?project_id=17&sort=priority:desc');
        });
    });

    it('should reject with error', () => {
      api.sendRequest.returns(Promise.reject({ message: 'Das war ein Fehler' }));
      return api.getIssues()
        .then(_ => {
          expect(_).not.to.eql('nie');
        })
        .catch(_ => {
          expect(_).to.eql('Das war ein Fehler');
        });
    });
  });

  describe('runQuerie()', () => {
    let api;

    before(() => {
      api = new Api({ https: true, project_id: 17, queries: {'test1': 55} });
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should throw', () => {
      expect(() => api.runQuerie()).to.throw('missing parameter: "query"');
    });

    it('should throw', () => {
      expect(() => api.runQuerie('test')).to.throw('unknown query "test"');
    });

    it('should not throw', () => {
      api.sendRequest.returns(Promise.resolve('{}'));
      expect(() => api.runQuerie('test1')).not.to.throw();
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns(Promise.resolve('{"result": "hier"}'));
      return api.runQuerie('test1')
        .then(_ => {
          expect(_).to.eql({ result: 'hier' });
          expect(api.sendRequest).to.have.been.calledWith('GET', '/issues.json?project_id=17&query_id=55')
        });
    });

    it('should reject with error', () => {
      api.sendRequest.returns(Promise.reject({ message: 'Das war ein Fehler' }));
      return api.getIssues()
        .then(_ => {
          expect(_).not.to.eql('nie');
        })
        .catch(_ => {
          expect(_).to.eql('Das war ein Fehler');
        });
    });
  });


  describe('updateTicket()', () => {
    let api;

    before(() => {
      api = new Api({ https: true });
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
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
      api = new Api({ https: true });
      sinon.stub(api, 'sendRequest');
    });

    afterEach(() => {
      api.sendRequest.reset();
    });

    it('should call sendRequest()', () => {
      api.sendRequest.returns('hier');
      expect(api.logTime(17, 3.45, 678, '2018-02-14')).to.equal('hier');
      const daten = {
        time_entry: {
          issue_id: 17,
          hours: 3.45,
          activity_id: 678,
          spent_on: '2018-02-14'
        }
      };
      expect(api.sendRequest).to.have.been.calledWith('POST', '/time_entries.json', daten);
    });
  });

  describe('sendRequest()', () => {
    let api;

    before(() => {
      api = new Api({ https: true });
    });

    it('should be a function', () => {
      expect(api.sendRequest).to.be.a('function');
    });

  });

});
