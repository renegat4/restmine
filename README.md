# restmine

Link git to Redmine:

* add refs-tags to commits so commits are linked to issues
* take-over issues (set assigned to, status, category) on checkout
* log time spent on issues


## usage

First create an issue in Redmine as usual. Then checkout a branch with a name
like `iss1234`. 1234 is the issue id and `iss` is the default prefix for an
issue you work on. `restmine` will now assign the issue to you, set its status
to assigned and set the category. While working on this branch restmine will
automatically append `refs #1234` to each commit. When the commits get pushed
to the repository (which is configured in redmine), redmine will scan the
commits and link them to issue #1234.

When the work is done, checkout master again. Now restmine will log the time
spent on that issue in redmine with the configured activity id.


The prefix `iss` is the default which triggers the take-over of an issue. You
are free to configure other prefixes with individual activity ids, but only
`iss` will trigger the take-over.


## setup

    $ rr init

This will install the required hooks (commit-msg, post-checkout). Existing
hooks will be renamed. In windows the user needs the
`SeCreateSymbolicLinkPrivilege` privilege. Or run the command as administrator.
See: [enabling-symlinks](https://ember-cli.com/user-guide/#enabling-symlinks)

Besides that the configuration file `.restmine.json` will be created.

``` json
  {
    "host": "redmine.example.com",
    "https": true,
    "key": "xxxxxxxxxxxxxxxxxxxxxx",
    "user_id": 0,
    "project_id": 0,
    "edit_id": 0,
    "category_id": 0,
    "activity": {
      "iss": 0,
      "org": 0
    }
  }
```

`key`: the users [redmine-API-key](http://www.redmine.org/projects/redmine/wiki/Rest_api#Authentication).
`user_id`: the users redmine user ID.
`project_id`: the ID of the corresponding project.
`edit_id`: the ID of 'assigned' status.
`category_id`: the category ID which will be set in take-over
`activity.iss` is required. `activity.org` is an example.

If `category_id` is undefined restmine will not touch the issue-category.

To find the `project_id`, `category_id` and `activity-ids` first configure
authentication (`host`, `https`, `key`), then use following commands:

    $ rr projects
    $ rr categories
    $ rr activities

`edit_id` is the status-id of issues which are assigned. The status will be set
on an issue when a corresponding branch with iss-prefix gets checked out. To
find the id use:

    $ rr status


## issue-branches

restmine will only become active when it recognises an issue-branch.

Issue-branches need to be named like (RegExp):

    ^([a-zA-Z]{3})(\d+)$

This is three characters followed by a number.

The characters correspond to the configured `activity.`
and the number is the issue id.

## show an issue

restmine can show the current issue (if on an issue-branch):

    $ rr

Or an arbitrary one:

    $ rr (showTicket|show|s) 1234

## show assigned issues

restmine can list all open issues (in the configured project):

    $ rr (issues|i)

## Time tracking

restmine can be used to log time on an issue.

    $ rr (logTime|lt) 3345 2:30 2018-10-20 iss "this is a comment"

Order of parameters doesn't matter.

`iss` is the activity under which the time should be logged and corresponds to
the configured activity in the config-file. If left out, `iss` is the default.

If no date is given, it defaults to today.

If the user is on an issue-branch like org3345 and no issue-id is given
on the command line, the time will be logged on that issue (3345).

## Queries

restmine can run suer defined redmine-queries.
First configure a query in redmine as usual and list available query
with restmine to get the ID:

    $ rr queries

Then add a `queries`-section to the config-file for the queries with a
identifying name an their ID:

``` json
  {
    "queries": {
      "query1": 44
    }
  }
```

Run the query:

    $ rr (query|q) query1

