'use strict';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

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
          console.log(`OS ${process.platform} kenn ich nich.`);
          break;
    }
  }

  const configFile = '.restmine.json';
  if (!fs.existsSync(configFile)) {
    const configuration = `{
  "host": "host.domain.tld",
  "https": true,
  "key": "xxxxxxxxxxxxxxxx",
  "user_id": 0,
  "project_id": 0,
  "edit_id": 0,
  "category_id": 0,
  "activity": {
    "org": 0,
    "iss": 0
  }
}`;
    fs.writeFileSync(configFile, configuration);
    fs.appendFileSync('.gitignore', `${configFile}\n`);
    console.log(colors.red(`Don't forget to edit "${configFile}".`));
  }


}

module.exports = setup;
