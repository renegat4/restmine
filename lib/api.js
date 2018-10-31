class Api {
  constructor(config) {
    this.config = config;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.http = config.https ? require('https') : require('http');
    this.options = {
      method: 'GET',
      host: config.host,
      port: (config.https ? 443 : 80),
      headers: {
        'X-Redmine-API-Key': config.key,
        'Content-Type': 'application/json; charset=utf-8'
      }
    };
  }

  sendRequest(method, path, payload) {
    return new Promise((resolve, reject) => {
      const options = Object.assign({}, this.options);
      options.path = path;
      options.method = method;
      const request = this.http.request(options, response => {
        response.setEncoding('utf8');
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error(`request failed, status: ${response.statusCode} ${response.statusMessage}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', err => reject(err));
      if (payload) {
        request.write(JSON.stringify(payload));
      }
      request.end();
    });
  }

  /**
   * gibt einen Promise zurück
   * der mit dem Issue-Object resolved
   * oder mit dem HTTP-Fehler rejected
   */
  getTicket(id) {
    return this
      .sendRequest('GET', `/issues/${id}.json`)
      .then(response => JSON.parse(response).issue)
      .catch(_ => Promise.reject(_.message));
  }

  getIssues() {
    const project_id = this.config.project_id;
    return this
      .sendRequest('GET', `/issues.json?project_id=${project_id}&sort=priority:desc`)
      .then(response => JSON.parse(response).issues)
      .catch(error => Promise.reject(error.message));
  }

  getIssueStatuses() {
    return this
      .sendRequest('GET', '/issue_statuses.json')
      .then(response => JSON.parse(response))
      .catch(error => Promise.reject(error.message));
  }

  getIssueCategories() {
    const project_id = this.config.project_id;
    return this
      .sendRequest('GET', `/projects/${project_id}/issue_categories.json`)
      .then(response => JSON.parse(response))
      .catch(error => Promise.reject(error.message));
  }

  updateTicket(id, data) {
    return this.sendRequest('PUT', `/issues/${id}.json`, data);
  }

  logTime(issueId, hours, activityId, spentOn) {
    const data = {
      time_entry: {
        issue_id: issueId,
        hours: hours,
        activity_id: activityId,
        spent_on: spentOn
      }
    };
    return this.sendRequest('POST', '/time_entries.json', data);
  }
}
 
module.exports = Api;
