# restmine

Link git to Redmine:

* add refs-tags to commits so commits are linked to issues
* take-over issues (set assigned to, status, category) on checkout
* log time spent on issues


## usage

First create an issue in Redmine as usual. Then checkout a branch with a name
like `iss1234`. 1234 is the issue id and iss is the default prefix for an
issue you work on. restmine will now assign the issue to you, set its status
to assigned and set the category. While working on this branch restmine will
automatically append `#refs 1234` to each commit. When the commits get pushed
to the repository (which is configured in redmine), redmine will scan the
commits and link them to issue 1234.

When the work is done, checkout master again. Now restmine will log the time
spent on that issue in redmine with the configured activity id.


The prefix `iss` is the default which triggers the take-over of an issue. You
are free to configure other prefixes with individual activity ids, but only
`iss` will trigger the take-over.


## setup

    $ rr setup

This will install the required hooks (commit-msg, post-checkout). Existing
hooks will be renamed. In windows the user needs the
`SeCreateSymbolicLinkPrivilege` privilege. Or run the command as administrator.
See: (https://ember-cli.com/user-guide/#symlinks-on-windows)

Besides that an `.activate`-script will be created. This script exports
some environment variables which restmine needs.

    REDMINE_HOST: hostname where redmine is installed (redmine.example.com)
    REDMINE_HTTPS: boolean (true -> use https)
    REDMINE_KEY: the users API-key
    REDMINE_USERID: the users id in redmine
    REDMINE_EDIT_ID: the id of 'assigned' status
    REDMINE_CATEGORY_ID: the category id which will be set on take-over      
    REDMINE_ISS_ACTIVITYID: the activity id for time logged on issues
    REDMINE_ORG_ACTIVITYID: activity id for time logged on 'orga'-issues

`REDMINE_ISS_ACTIVITYID` is required. `REDMINE_ORG_ACTIVITYID` is an example.

(Currently you need to find the `CATEGORY_ID` and `ACTIVITY_ID` by examining
the redmine website. For a list of statuses there is `rr statuses`.)

## activation

To start using restmine just source the `.activate`-script

    $ . .activate

Note that this needs to be done in the same shell where git will be used so
restmine finds the environtment variables.

## issue-branches

restmine will only become active when it recognises an issue-branch.

Issue-branches need to be named like (RegExp):

    ^(...)([0-9]+)

This is three characters followed by a number.

The characters correspond to the configured REDMINE_..._ACTIVITYID
and the number is the issue id.

# Show an issue

restmine can show the current issue:

    $ rr

Or an arbitrary one:

    $ rr get 1234

