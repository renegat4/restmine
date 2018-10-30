'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const Cli = require('../lib/cli');

describe('Cli', () => {

  describe('isIssueBranch()', () => {
    let cli;

    before(() => {
      cli = new Cli();
    });

    it('should be a function', () => {
      expect(cli.isIssueBranch).to.be.a('function');
    });

    it('should return the ticket id', () => {
      expect(cli.isIssueBranch('iss1234')).to.deep.equal({ type: 'iss', id: '1234' });
      expect(cli.isIssueBranch('iss1')).to.deep.equal({ type: 'iss', id: '1' });
      expect(cli.isIssueBranch('iss3344')).to.deep.equal({ type: 'iss', id: '3344' });
      expect(cli.isIssueBranch('org3355')).to.deep.equal({ type: 'org', id: '3355' });
      expect(cli.isIssueBranch('org1')).to.deep.equal({ type: 'org', id: '1' });
    });

    it('should return false', () => {
      expect(cli.isIssueBranch('test')).to.be.false;
      expect(cli.isIssueBranch('hier')).to.be.false;
      expect(cli.isIssueBranch('')).to.be.false;
      expect(cli.isIssueBranch('test')).to.be.false;
      expect(cli.isIssueBranch('hier')).to.be.false;
      expect(cli.isIssueBranch('iss')).to.be.false;
      // expect(cli.isIssueBranch('1234')).to.be.false;
    });
  });

  describe('logTime()', () => {
    let cli;

    const api = {
      logTime: function () {}
    };

    before(() => {
      sinon.stub(api, 'logTime').returns(Promise.resolve('OK'));
      cli = new Cli(api, {}, {}, 2);
    });

    after(() => {
      api.logTime.restore();
    });

    it('should be a function', () => {
      expect(cli.logTime).to.be.a('function');
    });

    it('should call api.logTime()', () => {
      return cli
        .logTime(33, 4.5, 7)
        .then(_ => {
          expect(_).to.equal('OK');
          expect(api.logTime).to.have.been.calledWith(33, 4.5, 7);
        });
    });
  });

  describe('getTicket()', () => {
    let cli;

    const api = {
      getTicket: function () {}
    };

    before(() => {
      sinon.stub(api, 'getTicket').returns(Promise.resolve('{ "issue": {} }'));
      cli = new Cli(api, {}, {}, 22);
      sinon.stub(cli, 'printTicket').returns('');
    });

    after(() => {
      cli.printTicket.restore();
      api.getTicket.restore();
    });

    it('should call api.getTicket()', () => {
      return cli
        .getTicket(234)
        .then(_ => {
          expect(api.getTicket).to.have.been.calledWith(234);
        });
    });
  });

  describe('getTimeDelta()', () => {
    let cli;

    before(() => {
      cli = new Cli();
    });

    it('should be a function', () => {
      expect(cli.logTime).to.be.a('function');
    });

    it('should return hours in decimal', () => {
      const oneHour = 60 * 60 * 1000;
      expect(cli.getTimeDelta(0, 2 * oneHour)).to.equal(2);
      expect(cli.getTimeDelta(0, 0.5 * oneHour)).to.equal(0.5);
      expect(cli.getTimeDelta(0, 0.25 * oneHour)).to.equal(0.25);
      expect(cli.getTimeDelta(0.5 * oneHour, 3 * oneHour)).to.equal(2.5);
    });
  });

  describe('getCheckoutTime()', () => {
    const reflog = '4554b66 (hier) HEAD@{2018-03-28T21:01:42+02:00}: checkout: moving from master to test';
    const git = { reflog: function () {} };
    let cli

    before(() => {
      sinon.stub(git, 'reflog').returns(reflog);
      cli = new Cli({}, git, {}, 1);
    });

    after(() => {
      git.reflog.restore();
    });

    it('should be a function', () => {
      expect(cli.getCheckoutTime).to.be.a('function');
    });

    it('should call git.reflog()', () => {
      cli.getCheckoutTime('hier');
      expect(git.reflog).to.have.been.calledWith('to hier');
    });
    
    it('should return ISO 8601', () => {
      expect(cli.getCheckoutTime('test')).to.equal('2018-03-28T21:01:42+02:00');
    });
  });

  describe('enterIssueBranch()', () => {
    let api = { getTicket: function () {} };
    let cli;
    const testTicket = { id: 12 };

    beforeEach(() => {
      sinon.stub(api, 'getTicket').returns(Promise.resolve(testTicket));
      cli = new Cli(api, {}, {}, 1);
      sinon.stub(cli, 'printTicket').returns('halo')
      sinon.stub(cli, 'takeOver');
    });

    afterEach(() => {
      api.getTicket.restore();
      cli.printTicket.restore();
      cli.takeOver.restore();
    });

    it('should be a function', () => {
      expect(cli.getCheckoutTime).to.be.a('function');
    });

    it('should call api.getTicket()', () => {
      return cli
        .enterIssueBranch({ id: 55 })
        .then(() => {
          expect(api.getTicket).to.have.been.calledWith(55);
        });
    });

    it('should call printTicket()', () => {
      return cli
        .enterIssueBranch({ id: 55 })
        .then(() => {
          expect(cli.printTicket).to.have.been.calledWith({ id: 12 });
        });
    });

    it('should call takeOver()', () => {
      return cli
        .enterIssueBranch({ id: 55 })
        .then(() => {
          expect(cli.takeOver).to.have.been.calledWith({ id: 55 }, 'halo');
        });
    });
  });

  describe('leaveIssueBranch()', () => {
    let cli;
    const branchName = 'test';
    const env = Object.assign({}, process.env);
    const issue = {
      id: 22
    };

    before(() => {
      cli = new Cli({}, {}, env, 1);
      sinon.stub(cli, 'getCheckoutTime').returns('2018-01-10T10:00:00.000Z');
      sinon.stub(cli, 'getActivityId').returns(10);
      sinon.stub(cli, 'logTime');
      sinon.stub(cli, 'getTimeDelta').returns(3);
    });

    it('should be a function', () => {
      expect(cli.leaveIssueBranch).to.be.a('function');
    });

    it('should call cli.getCheckoutTime()', () => {
      cli.leaveIssueBranch(issue, branchName);
      expect(cli.getCheckoutTime).to.have.been.calledWith('test');
    });

    it('should call cli.getTimeDelta()', () => {
      cli.leaveIssueBranch(issue, branchName);
      expect(cli.getTimeDelta).to.have.been.calledWith(1515578400000);
    });

    it('should call cli.logTime()', () => {
      cli.leaveIssueBranch(issue, branchName);
      expect(cli.logTime).to.have.been.calledWith(22, '3.00', 10);
    });

    describe('timeDelta == 0', () => {
      before(() => {
        cli.getTimeDelta.returns(0);
        cli.logTime.reset();
      });

      it('should not call cli.logTime()', () => {
        cli.leaveIssueBranch(issue, branchName);
        expect(cli.logTime).not.to.have.been.called;
      });
    });

  });

  describe('info()', () => {
    let cli;

    const git = {
      currentBranchName: () => {} 
    };

    before(() => {
      sinon.stub(git, 'currentBranchName').returns('iss1234');
      cli = new Cli({}, git, {}, 4);
      sinon.stub(cli, 'getTicket').returns(Promise.resolve('OK'));
      sinon.stub(cli, 'isIssueBranch');
    });

    it('should be a function', () => {
      expect(cli.info).to.be.a('function');
    });

    describe('issueBranch', () => {
      before(() => {
        cli.isIssueBranch.returns({ id: 44, type: 'iss' });
      });

      after(() => {
        cli.getTicket.reset();
      });

      it('should call getTicket()', () => {
        return cli.info()
          .then(() => {
            expect(cli.getTicket).to.have.been.calledWith(44);
          });
      });
    });

    describe('!issueBranch', () => {
      before(() => {
        cli.isIssueBranch.returns(false);
      });

      it('should not call getTicket()', () => {
        expect( cli.info()).to.be.an('undefined');
        expect(cli.getTicket).not.to.have.been.called;
      });

    });

  });

  describe.only('parseLogTimeArgs()', () => {
    let cli;

    const config = {
      user_id: 2,
      category_id: 3,
      edit_id: 4,
      activity: {
        asd: 12,
        iss: 33
      }
    };

    const api = {};
    const git = {};
    const fs = {};

    before(() => {
      cli = new Cli(api, git, config, fs);
    });

    it('should return a timeDef-object', () => {
      const timeDef = cli.parseLogTimeArgs(['4:00']);
      expect(timeDef).to.have.all.keys('issue_id', 'hours', 'activity_id', 'spent_on');
    });

    describe('issue_id', () => {
      it('should be the given id', () => {
        expect(cli.parseLogTimeArgs(['0:30', '1234']).issue_id).to.equal('1234');
        expect(cli.parseLogTimeArgs(['456', '0:30', '1234']).issue_id).to.equal('1234');
        expect(cli.parseLogTimeArgs(['456', '0:30']).issue_id).to.equal('456');
        expect(cli.parseLogTimeArgs(['45', '0:30']).issue_id).to.equal('45');
      });
    });

    describe('spent_on', () => {
      it('should be today', () => {
        const now = new Date().toISOString().split('T')[0];
        const timeDef = cli.parseLogTimeArgs(['3:00']);
        expect(timeDef.spent_on).to.equal(now);
      });

      it('should be the given date', () => {
        expect(cli.parseLogTimeArgs(['2018-10-20', '2:30']).spent_on).to.equal('2018-10-20');
        expect(cli.parseLogTimeArgs(['a', 'b', '2018-10-20', 'v', '2:30']).spent_on).to.equal('2018-10-20');
        expect(cli.parseLogTimeArgs(['a', 'b', '2018-10-20', '2018-10-21', '2:30']).spent_on).to.equal('2018-10-21');
        expect(cli.parseLogTimeArgs(['2018-10-21', 'asd', '2:30']).spent_on).to.equal('2018-10-21');
        expect(cli.parseLogTimeArgs(['2018-10-21', '2018', '2:30']).spent_on).to.equal('2018-10-21');
        expect(cli.parseLogTimeArgs(['2018-10-21', '2018-10-2', '2:30']).spent_on).to.equal('2018-10-21');
      });
    });

    describe('hours', () => {
      it('should be the given hours in decimal', () => {
        expect(cli.parseLogTimeArgs(['2:30']).hours).to.equal('2.50');
        expect(cli.parseLogTimeArgs([':30']).hours).to.equal('0.50');
        expect(cli.parseLogTimeArgs([':25']).hours).to.equal('0.42');
        expect(cli.parseLogTimeArgs(['3:00']).hours).to.equal('3.00');
        expect(() => cli.parseLogTimeArgs([])).to.throw('no time given');
        expect(() => cli.parseLogTimeArgs([':00'])).to.throw('no time given?');
        expect(() => cli.parseLogTimeArgs([':0'])).to.throw('no time given?');
        expect(() => cli.parseLogTimeArgs(['0:00'])).to.throw('no time given?');
        expect(() => cli.parseLogTimeArgs(['100:00'])).to.throw('no time given?');
        expect(() => cli.parseLogTimeArgs(['10:200'])).to.throw('no time given?');
      });
    });

    describe('activity_id', () => {
      it('should use default (iss) activity_id', () => {
        expect(cli.parseLogTimeArgs(['1:00']).activity_id).to.equal(33);
      });

      it('should be the id of the given activity-code', () => {
        expect(cli.parseLogTimeArgs(['iss', '1:00']).activity_id).to.equal(33);
        expect(cli.parseLogTimeArgs(['asd', '1:00']).activity_id).to.equal(12);
        expect(() => cli.parseLogTimeArgs(['tst', ':00'])).to.throw('unknown activity tst');
      });
    });
  });

  describe('takeOver()', () => {
    let cli;

    const config = {
      user_id: 2,
      category_id: 3,
      edit_id: 4
    };

    const api = {
      updateTicket: () => {}
    };

    const git = {};

    const fs = {};

    before(() => {
      sinon.stub(api, 'updateTicket');
      cli = new Cli(api, git, config, fs);
    });

    beforeEach(() => {
      api.updateTicket.reset();
    });

    it('should be a function', () => {
      expect(cli.takeOver).to.be.a('function');
    });

    describe('ticket-type == iss', () => {
      const handle = { type: 'iss' };

      it('should set assigned_to', () => {
        const issue = { id: 55, status: { id: 4 }, category: { id: 3 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).to.have.been.calledWith(55, { issue: { assigned_to_id: 2 } });
      });

      it('should set category_id', () => {
        const issue = { id: 55, status: { id: 4 }, assigned_to: { id: 2 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).to.have.been.calledWith(55, { issue: { category_id: 3 } });
      });

      it('should set status_id', () => {
        const issue = { id: 55, status: { id: 1234 }, assigned_to: { id: 2 }, category: { id: 3 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).to.have.been.calledWith(55, { issue: { status_id: 4 } });
      });
    });

    describe('ticket-type != iss', () => {
      const handle = {type: 'asd'};

      it('should do nothing', () => {
        const issue = { id: 55, status: { id: 4 }, category: { id: 3 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).not.to.have.been.called;
      });

      it('should do nothing', () => {
        const issue = { id: 55, status: { id: 4 }, assigned_to: { id: 2 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).not.to.have.been.called;
      });

      it('should do nothing', () => {
        const issue = { id: 55, status: { id: 1234 }, assigned_to: { id: 2 }, category: { id: 3 } };
        cli.takeOver(handle, issue);
        expect(api.updateTicket).not.to.have.been.called;
      });
    });

  });

  describe('commit_msg()', () => {
    let cli;

    const fs = {
      appendFileSync: () => {}
    };

    const git = {
      currentBranchName: () => {}
    };

    before(() => {
      sinon.stub(fs, 'appendFileSync');
      sinon.stub(git, 'currentBranchName');
      cli = new Cli({}, git, {}, fs, 1);
      sinon.stub(cli, 'isIssueBranch');
    });

    afterEach(() => {
      cli.isIssueBranch.reset();
      git.currentBranchName.reset();
      fs.appendFileSync.reset();
    });

    it('should be a function', () => {
      expect(cli.commit_msg).to.be.a('function');
    });

    it('should call git.currentBranchName()', () => {
      cli.commit_msg();
      expect(git.currentBranchName).to.have.been.called;
    });

    it('should call isIssueBranch()', () => {
      git.currentBranchName.returns('hier');
      cli.commit_msg();
      expect(cli.isIssueBranch).to.have.been.calledWith('hier');
    });

    it('should call fs.appendFileSync()', () => {
      cli.isIssueBranch.returns({ id: 34 })
      cli.commit_msg('dateiname');
      expect(fs.appendFileSync).to.have.been.calledWith('dateiname', '\nrefs #34');
    });

    it('should not call fs.appendFileSync()', () => {
      cli.isIssueBranch.returns(null);
      cli.commit_msg('dateiname');
      expect(fs.appendFileSync).not.to.have.been.called;
    });
  });

});
