class Api {
  constructor(host, https, key) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.http = https ? require('https') : require('http');
    this.options = {
      method: 'GET',
      host: host,
      port: (https ? 443 : 80),
      headers: {
        'X-Redmine-API-Key': key,
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
      .catch(_ => Promise.reject(_.message));
  }

  getIssueStatuses() {
    return this
      .sendRequest('GET', '/issue_statuses.json')
      .catch(_ => Promise.reject(_.message));
  }

  getIssueCategories() {
    return this
      .sendRequest('GET', '/issue_categories.json')
      .catch(_ => Promise.reject(_.message));
  }

  updateTicket(id, data) {
    return this.sendRequest('PUT', `/issues/${id}.json`, data);
  }

  logTime(issueId, hours, activityId) {
    // console.debug(`Api.logTime(${issueId}, ${hours}, ${activityId})`);
    const data = {
      time_entry: {
        issue_id: issueId,
        hours: hours,
        activity_id: activityId
      }
    };
    return this.sendRequest('POST', '/time_entries.json', data);
  }
}
 
module.exports = Api;
