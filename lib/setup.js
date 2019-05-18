'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const prompts = require('prompts');
const Api = require('../lib/api');

function validateUrl(url) {
  if (!/https?:\/\//.test(url.toLowerCase())) {
    return `Bitte inkl. Schema.`;
  }
  return true;
}

function validateKey(key) {
  if (!/[\d[a-f]{40}/.test(key)) {
    return `Der Key scheint nicht korreckt zu sein. Erwartet werden 40 Zeichen aus 0-9a-f.`;
  }
  return true;
}

function getApi(values) {
  const u = url.parse(values.url);
  const config = {
    host: u.host.replace(/:\d+$/, ''),
    port: u.port,
    https: u.protocol === 'https:',
    key: values.key,
  };
  if (values.project_id) {
    config.project_id = values.project_id;
  }
  return new Api(config);
}

function getProjectChoices(prev, values, prompt) {
  const api = getApi(values);
  return api.getProjects()
    .then(response => {
      return response.projects.map(p => { return { title: p.name, value: p.id }; });
    });
}

function getCategoryChoices(prev, values, prompt) {
  const api = getApi(values);
  return api.getIssueCategories()
    .then(response => {
      return response.issue_categories.map(c => {
        return {
          title: c.name,
          value: c.id,
        };
      });
    });
}

function getStatusChoices(prev, values, prompt) {
  const api = getApi(values);
  return api.getIssueStatuses()
    .then(response => {
      return response.issue_statuses.map(s => {
        return {
          title: s.name,
          value: s.id,
        };
      });
    });
}

function getActivityChoices(prev, values, prompt) {
  const api = getApi(values);
  return api.getActivities()
    .then(response => {
      return response.time_entry_activities.map(a => {
        return {
          title: a.name,
          value: a.id,
        };
      });
    });
}

async function queryUser() {

  const configuration = {};

  const questions = [
    {
      type: 'text',
      name: 'url',
      message: 'Wie lautet die Redmine-URL?',
      validate: validateUrl,
    },
    {
      type: 'text',
      name: 'key',
      message: 'Wie lautet Ihr API-Zugriffsschlüssel?',
      validate: validateKey
    },
    {
      type: 'select',
      name: 'project_id',
      message: 'Um welches Projekt geht es?',
      choices: getProjectChoices
    },
    {
      type: 'confirm',
      name: 'setCategory',
      message: 'Beim Auschecken eines Tickets die Kategorie setzen wenn leer?',
      initial: false,
    },
    {
      type: prev => prev ? 'select' : null,
      name: 'category_id',
      message: 'Welche Kategorie soll gesetzt werden?',
      choices: getCategoryChoices
    },
    {
      type: 'select',
      name: 'edit_id',
      message: 'Welches ist der Status „In Bearbeitung“?',
      choices: getStatusChoices
    },
    {
      type: 'select',
      name: 'iss_activity_id',
      message: 'Unter welcher Aktivität sollen die Zeiten erfasst werden?',
      choices: getActivityChoices
    }
  ];

  const result = await prompts(questions);

  let data = await getApi(result).getUser();
  result.user_id = data.user.id;

  return result;
}

function getConfigFrom(answers) {
  const u = url.parse(answers.url);
  const configuration = {
    host: u.host.replace(/:\d+$/, ''),
    port: u.port,
    https: u.protocol === 'https:',
    key: answers.key,
    user_id: answers.user_id,
    project_id: answers.project_id,
    edit_id: answers.edit_id,
    activity: {
      iss: answers.iss_activity_id,
    }
  };
  if (answers.setCategory) {
    configuration.category_id = answers.category_id;
  }
  return configuration;
}

function writeConfig(answers) {
  const configuration = getConfigFrom(answers);
  const configFile = '.restmine.json';
  fs.writeFileSync(configFile, JSON.stringify(configuration, null, 2));
  fs.appendFileSync('.gitignore', `${configFile}\n`);
}

function setup() {
  if (!fs.existsSync('.git')) {
    console.error('.git not found');
    process.exit(1);
  }

  const rrPath = path.join(path.dirname(__filename), '..', 'bin', 'rr');

  for (let hook of ['commit-msg', 'post-checkout'].map(_ => path.join('.git', 'hooks', _))) {
    if (fs.existsSync(hook)) {
      fs.renameSync(hook, `${hook}.old`);
    }
    switch (process.platform) {
        case 'freebsd':
        case 'darwin':
        case 'linux':
          fs.symlinkSync(rrPath, hook);
          break;
        case 'win32':
          try {
            fs.symlinkSync(rrPath, hook);
          } catch (e) {
            console.error(`An error occured. You may not have the privilege to
create sombolic links (SeCreateSymbolicLinkPrivilege).

https://ember-cli.com/user-guide/#enabling-symlinks

Or you may try to run setup as admin.

`);
          }
          break;
        default:
          console.log(`unknown platform ${process.platform}`);
          break;
    }
  }

}

module.exports = {
  setup: setup,
  queryUser: queryUser,
  writeConfig: writeConfig,
};
