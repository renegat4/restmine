const colors = require('colors/safe');

class Cli {
  constructor(api, git, config, fs) {
    this.git = git;
    this.api = api;
    this.config = config;
    this.fs = fs;
  }

  showTicket(branchNameOrTicketId) {
    let issueId;
    let issue;

    if (branchNameOrTicketId) { // command-line parameter
      if (/^\d+$/.test(branchNameOrTicketId)) { // numeric issueId
        issueId = branchNameOrTicketId;
      } else {
        issue = this.isIssueBranch(branchNameOrTicketId);
        if (issue) {
          issueId = issue.id;
        } else {
          console.log('not an issue branch');
          return;
        }
      }
    } else {
      branchNameOrTicketId = this.git.currentBranchName();
      issue = this.isIssueBranch(branchNameOrTicketId);
      if (issue) {
        issueId = issue.id;
      } else {
        console.log('not an issue branch');
        return;
      }
    }

    if (issueId) {
      this.getTicket(issueId);
    }
  }

  getTicket(issueId) {
    return this.api
      .getTicket(issueId)
      .then(issue => this.printTicket(issue))
      .catch(issue => console.error(issue));
  }

  parseLogTimeArgs(args) {
    const timedef = {
      spent_on: new Date().toISOString().split('T')[0],
      hours: 0
    };
    let m;
    args.forEach(arg => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
        timedef.spent_on = arg;
      } else if (m = arg.match(/^(\d{0,2}):(\d{2})$/)) {
        timedef.hours = ((+m[1] * 60 + +m[2]) / 60).toFixed(2);
      } else if (/^[a-zA-Z]{3}$/.test(arg)) {
        if (this.config.activity.hasOwnProperty(arg)) {
          timedef.activity_id = this.config.activity[arg];
        } else {
          throw new Error(`unknown activity ${arg}`);
        }
      } else if (/^\d+$/.test(arg)) {
        timedef.issue_id = arg;
      } else {
        timedef.comments = arg;
      }
    });
    if (timedef.issue_id === undefined) {
      timedef.issue_id = 55;
    }
    if (timedef.activity_id === undefined) {
      timedef.activity_id = this.config.activity['iss'];
    }
    if (timedef.hours === 0 || timedef.hours === '0.00') {
      throw new Error('no time given?');
    }
    return timedef;
  }

  logTimeCli(args) {
    const timedef = this.parseLogTimeArgs(args);
    this.logTime(timedef.issue_id, timedef.hours, timedef.activity_id, timedef.spent_on, timedef.comments);
  }

  logTime(issueId, hours, activityId, spentOn, comments) {
    return this.api
      .logTime(issueId, hours, activityId, spentOn, comments)
      .catch(_ => console.error(_));
  }

  isIssueBranch(branchName) {
    const match = branchName.match(/^([a-zA-Z]{3})(\d+)$/);
    if (match) {
      return {
        type: match[1],
        id: match[2]
      };
    } else {
      return false;
    }
  }

  /**
   * commit-msg
   * Hook wird beim commit aufgerufen
   * Parameter ist der Name der Datei mit der Commit-Message
   */
  commit_msg(messageFileName) {
    const branchName = this.git.currentBranchName();
    const issue = this.isIssueBranch(branchName);
    if (issue) {
      this.fs.appendFileSync(messageFileName, `\nrefs #${issue.id}`);
    }
  }

  info() {
    const branchName = this.git.currentBranchName();
    const issue = this.isIssueBranch(branchName);
    if (issue) {
      return this.getTicket(issue.id);
    }
  }

  showIssues() {
    this.api
      .getIssues()
      .then(issues => {
        issues.forEach(issue => {
          this.printTicket(issue);
          console.log('--------------------------------------------------');
        });
      });
  }

  /**
   * @param handle: { id: <ticketId>, type: <iss|org...>
   */
  takeOver(handle, issue) {
    if (handle.type !== 'iss') {
      return;
    }
    const userId = +this.config.user_id;
    const editId = +this.config.edit_id;
    const categoryId = +this.config.category_id;
    const useCategory = this.config.category_id !== undefined;

    let update = false;
    const data = { issue: {} };

    if (!issue.assigned_to || issue.assigned_to.id != userId) {
      data.issue.assigned_to_id = userId;
      update = true;
    }

    if (issue.status.id != editId) {
      data.issue.status_id = editId;
      update = true;
    }

    if (useCategory && !issue.category) {
      data.issue.category_id = categoryId;
      update = true;
    }

    if (update) {
      return this.api.updateTicket(issue.id, data);
    }
  }

  getIssueStatuses() {
    return this.api
      .getIssueStatuses()
      .then(statuses => console.log(this.formatStatuses(statuses)));
  }

  getIssueCategories() {
    return this.api
      .getIssueCategories()
      .then(categories => console.log(this.formatCategories(categories)));
  }

  getActivities() {
    return this.api
      .getActivities()
      .then(acts => console.log(this.formatActivities(acts)));
  }

  formatActivities(list) {
    let result = [];
    for (let c of list.time_entry_activities) {
      result.push(`${c.id}\t${c.name}`);
    }
    return result.join('\n');
  }

  formatCategories(list) {
    let result = [];
    for (let c of list.issue_categories.sort((a, b) => a.name.localeCompare(b.name))) {
      result.push(`${c.id}\t${c.name}`);
    }
    return result.join('\n');
  }

  formatStatuses(list) {
    let result = [];
    for (let s of list.issue_statuses.sort((a, b) => a.name.localeCompare(b.name))) {
      result.push(`${s.id}\t${s.name}`);
    }
    return result.join('\n');
  }

  /**
   * @param issue: { id: <ticketId>, type: <iss|org|...> }
   */
  enterIssueBranch(descriptor) {
    return this.api
      .getTicket(descriptor.id)
      .then(issue => this.printTicket(issue))
      .then(issue => this.takeOver(descriptor, issue));
  }

  /**
   * Beim Verlassen eines Ticket-Branches die darauf verbrachte Zeit loggen
   */
  leaveIssueBranch(issue, branchName) {
    const checkedout = new Date(this.getCheckoutTime(branchName)).getTime();
    if (checkedout) {
      const now = new Date().getTime();
      const delta = this.getTimeDelta(checkedout, now);
      const logTime = delta.toFixed(2);
      const spentOn = new Date().toISOString().split('T')[0];
      console.log(`Zeit auf #${issue.id}: ${logTime}h`);
      if (logTime != '0.00') {
        this.logTime(issue.id, logTime, this.getActivityId(issue.type), spentOn);
      }
    }
  }

  /**
   * Die activity-id zum Branch-Typ aus der Umgebung holen
   */
  getActivityId(issueType) {
    const type = issueType.toLowerCase();
    if (this.config.activity[type]) {
      return this.config.activity[type];
    } else {
      throw new Error(`unknown issue-type ${type}`);
    }
  }

  /**
   * post-checkout
   * Hook wird nach einem checkout aufgerufen
   * Parameter sind
   * - die ref des verlassenen HEAD
   * - die ref des betretenen HEAD
   * - flag zeigt an ob es ein Branch-Checkout war 1 oder eine Datei 0
   */
  post_checkout(previousHEAD, newHEAD, flag) {
    const isBranchCO = flag === '1';
    const reflog = this.git.reflog();
    const re = /checkout: moving from ([^ ]+) to ([^ ]+)/;
    const match = reflog.match(re);

    if (!match) {
      // keine reflog über einen Branchwechsel? Seltsam...
      return;
    }

    const sourceBranch = match[1];
    const targetBranch = match[2];

    const isBranchChange = sourceBranch !== targetBranch;

    if (isBranchCO && isBranchChange) {
      const sourceIssue = this.isIssueBranch(sourceBranch);
      const targetIssue = this.isIssueBranch(targetBranch);
      
      // wurde ein Branch verlassen der zu einem Ticket gehört?
      if (sourceIssue) {
        this.leaveIssueBranch(sourceIssue, sourceBranch);
      }

      if (targetIssue) {
        this.enterIssueBranch(targetIssue);
      }
    }
  }

  /**
   * liefert den Zeitpunkt des Checkouts
   * in ISO-8601
   */
  getCheckoutTime(branchName) {
    const reflog = this.git.reflog(`to ${branchName}`);
    const match = reflog.match(/HEAD@{([^}]+)}/);
    return match ? match[1] : undefined;
  }

  /**
   * liefert die Zeit in Stunden dezimal
   */
  getTimeDelta(start, end) {
    const millisec = end - start;
    const minutes = millisec / 1000 / 60;
    const hours = minutes/60;
    return hours;
  }

  printTicket(issue) {
    this.print(this.terse(issue));
    return issue;
  }

  print(message) {
    console.log(message);
  }

  terse(issue) {
    const output = [];
    let estimated_hours = null;
    output.push(`Ticket #${issue.id}`);
    output.push('Titel: ' + colors.green(issue.subject));
    output.push(`Priorität: ${issue.priority.name}`);
    output.push(`Status: ${issue.status.name}`);
    if (issue.author) {
      output.push(`Autor: ${issue.author.name}`);    
    }
    if (issue.assigned_to) {
      output.push(`Zugewiesen: ${issue.assigned_to.name}`);
    }
    if (issue.estimated_hours) {
      output.push(`Geschätzter Aufwand: ${issue.estimated_hours} h`);
      estimated_hours = issue.estimated_hours;
    }
    if (issue.spent_hours) {
      let hours = issue.spent_hours;
      if (estimated_hours !== null) {
        if (issue.spent_hours > estimated_hours) {
          hours = colors.red(hours.toFixed(2));
        } else {
          hours = colors.green(hours.toFixed(2));
        }
      } else {
        hours = hours.toFixed(2);
      }
      output.push(`Aufgewendete Zeit: ${hours} h`);
    }
    return output.join('\n');
  }

}

module.exports = Cli;

