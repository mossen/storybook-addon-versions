# storybook-addon-versions

## Install

```sh
npm i @mossen/storybook-addon-versions

```

```sh
npm i @mossen/storybook-addon-versions

```

This addon allows you to navigate different versions of your components, if you have a setup that produces a different static Storybook build for each of your versions. As such, if you build a static Storybook and host it in, say, the following directory structure:

```sh
- static-storybook
|-- 0.0.1
|-- 0.0.2
|-- 0.1.2
|-- 0.2.5
```

the addon will allow you to navigate the various versions via the `Versions` panel:

![Versions demo](./docs/versions-demo.gif)

## Configuration

The addon attempts to get a list of available style guide versions from the root of your host. If they are found it will show a dropdown which then lets you navigate to the various versions, as such allowing users to see how a component may have changed over different versions.

## Usage

1. Include the addon in your `addons.js`

```javascript
import '@mossen/storybook-addon-versions';
```

2. Create the Versions config at `.storybook/storybook-config.json`

```json
{
  "storybook": {
    "versions": {
      "availableVersions": [
        "0.0.1",
        "0.0.2",
        "0.1.2",
        "0.2.5"
      ],
      "hostname": "localhost:8000",
      "localhost": "localhost:9001",
      "regex": "\/([^\/]+?)\/?$"
    }
  }
}
```

or without `hostname` property, to use the current hostname from the browser to generate the version links in the panel:

```json
{
  "storybook": {
    "versions": {
      "availableVersions": [
        "0.0.1",
        "0.0.2",
        "0.1.2",
        "0.2.5"
      ],
      "regex": "\/([^\/]+?)\/?$"
    }
  }
}
```

### Options

- `availableVersions`: An array of available versions.
- `hostname`: The hostname of where the static builds are. For now you need to add the path if you are expecting links to work in a local dev build but *not* in your normal hosted config.
- `localhost`: Where the local dev build is, when running in dev mode
- `regex`: This is for a regular expression that will extract the version number for your URL. This is dependant on the way you store the static storybook builds. The example above will work for the format `http://localhost:port/<version>/` so for example, version `0.1.2` would be expected to be found like this `http://mystorybook/0.1.2/`.

## Integration with CI/CD (gitlab)

```yaml
.pages:
  stage: build
  resource_group: build-page
  variables:
    PAGES_BRANCH: gl-pages
    HTTPS_REMOTE: https://gitlab-ci-token:${FUNCTIONAL_USER_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git
    PAGES_TAG: $CI_COMMIT_TAG
  rules:
    - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH
      variables:
        PAGES_TAG: 'latest'
    - if: $CI_COMMIT_REF_NAME =~ /^v/
  before_script:
    - git version
    - curl -sSLf "$(curl -sSLf https://api.github.com/repos/tomwright/dasel/releases/tags/v1.27.3 | grep browser_download_url | grep linux_amd64 | grep -v .gz | cut -d\" -f 4)" -L -o dasel && chmod +x dasel
    - mv ./dasel /usr/local/bin/dasel
    - git config user.name $GITLAB_USER_NAME
    - git config user.email $GITLAB_USER_EMAIL
    # CI_COMMIT_SHA=$(git rev-parse HEAD)
    - git show-ref -q --heads $PAGES_BRANCH && git branch -D $PAGES_BRANCH
    - git fetch origin $PAGES_BRANCH && git checkout -b $PAGES_BRANCH origin/$PAGES_BRANCH || echo "Pages branch not deployed yet."
    - test -d ./public && cd ./public && PAGES_VERSIONS=$(find . -type d -maxdepth 1 | sed '1d' | sed 's/\.\///') && cd ..
    - echo "$PAGES_VERSIONS"
    - ls -lha
    - git checkout $CI_COMMIT_SHA
    - ls -lha
    - test -d ./docs && rm -rf ./docs
    - test -d ./public && rm -rf ./public
  script:
    - CURRENT_VERSION=$(/usr/local/bin/dasel -f ./package.json --plain .version)
    - BUILD_DIR="./public"
    - echo "$CURRENT_VERSION"
    - echo $BUILD_DIR
    - test -d $BUILD_DIR && rm -rf "${BUILD_DIR:?}/$CURRENT_VERSION"
    - mkdir -p "$BUILD_DIR"
    - yarn build-storybook --quiet -o "$BUILD_DIR/$CURRENT_VERSION"
    - ls
    - cp .storybook/versioning/storybook-config.json "$BUILD_DIR/"
    - cp .storybook/versioning/index.html "$BUILD_DIR/"
    - test -f "$BUILD_DIR/storybook-config.json" && cat "$BUILD_DIR/storybook-config.json" && echo -e "\n"
    # - test -f "$BUILD_DIR/storybook-config.json" && mv -f "$BUILD_DIR/storybook-config.json" "$BUILD_DIR/storybook-config.json.new"
    - git checkout $PAGES_BRANCH
    - rm -f "$BUILD_DIR/latest"
    - cd $BUILD_DIR && ln -s "$CURRENT_VERSION" ./latest && cd ..
    - /usr/local/bin/dasel delete -p json -f ./public/storybook-config.json ".storybook.versions.availableVersions"
    - for PAGES_VERSION in $PAGES_VERSIONS; do /usr/local/bin/dasel put string -p json -f $BUILD_DIR/storybook-config.json -m ".storybook.versions.availableVersions.[]" "$PAGES_VERSION"; done
    # - cat $BUILD_DIR/storybook-config.json | /usr/local/bin/dasel select -p json .storybook.versions.availableVersions --plain | grep "$CURRENT_VERSION" && /usr/local/bin/dasel put string -p json -f $BUILD_DIR/storybook-config.json -m ".storybook.versions.availableVersions.[]" "$CURRENT_VERSION"
    - test -f "$BUILD_DIR/storybook-config.json" && cat "$BUILD_DIR/storybook-config.json" && echo -e "\n"
    - git add -A "$BUILD_DIR"
    - git diff-index --quiet HEAD && echo "Nothing to commit..." || git commit --untracked-files=no -m "Add version $CURRENT_VERSION"
    - git push $HTTPS_REMOTE gl-pages
  after_script:
    - test -d ./docs && rm -rf ./docs
    - test -d ./public && rm -rf ./public
```

The above code does the following steps:

- creates an empty branch with the name `gl-pages`

- deletes a checkout `gl-pages` branch: `git show-ref -q --heads $PAGES_BRANCH && git branch -D $PAGES_BRANCH`
- checkout again the `gl-pages` branch from remote: `git fetch origin $PAGES_BRANCH && git checkout -b $PAGES_BRANCH origin/$PAGES_BRANCH || echo "Pages branch not deployed yet."`
- creates a list of available Versions in the checkout `gl-pages` branch: `test -d ./public && cd ./public && PAGES_VERSIONS=$(find . -type d -maxdepth 1 | sed '1d' | sed 's/\.\///') && cd ..`
- in the current branch, it checksout the head ref ([detached head](https://www.cloudbees.com/blog/git-detached-head)): `git checkout $CI_COMMIT_SHA`
- removes the build directory, because we just need to build the new version: `test -d ./public && rm -rf ./public`
- read out the current version of the project: `CURRENT_VERSION=$(/usr/local/bin/dasel -f ./package.json --plain .version)`
- set the build dir-variable: `BUILD_DIR="./public"`
- build the storybook: `yarn build-storybook --quiet -o "$BUILD_DIR/$CURRENT_VERSION"`
- copy the addon configuration file [storybook-config.json](docs/storybook-config.json) to the build-dir: `cp .storybook/versioning/storybook-config.json "$BUILD_DIR/"`
- copy a [index.html](docs/index.html), which redirects to `http://localhost/` to `http://localhost/latest` to the build-dir: `cp .storybook/versioning/index.html "$BUILD_DIR/"`
- checkout `gl-pages`, we will endup with only the untracked files under `./public` to be available: `git checkout $PAGES_BRANCH`
- remove the `latest` symlink which came with the checkout from branch `gl-pages`: `rm -f "$BUILD_DIR/latest"`
- create a symlink to the current version: `cd $BUILD_DIR && ln -s "$CURRENT_VERSION" ./latest && cd ..`
- deletes the `availableVersions` array of the json file: `/usr/local/bin/dasel delete -p json -f ./public/storybook-config.json ".storybook.versions.availableVersions"`
- the previous stored list of existing version get writen to the config: `for PAGES_VERSION in $PAGES_VERSIONS; do /usr/local/bin/dasel put string -p json -f $BUILD_DIR/storybook-config.json -m ".storybook.versions.availableVersions.[]" "$PAGES_VERSION"; done`
- t.b.d. Add the current version also to the list
- add the changes to the branch `gl-pages`: `git add -A "$BUILD_DIR"`
- check if there are changes (because, otherwiese the pipeline fail with this step): `git diff-index --quiet HEAD && echo "Nothing to commit..." || git commit --untracked-files=no -m "Add version $CURRENT_VERSION"`
- push the changes to the `gl-pages` repository via _temporary-repository url wich includes also the credentials_: `git push $HTTPS_REMOTE gl-pages`

```sh
HTTPS_REMOTE: https://gitlab-ci-token:${FUNCTIONAL_USER_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git
```

a complete example can be found here: [docs/.gitlab-ci.yml](docs/.gitlab-ci.yml)

## Notes

This is a fork of <https://github.com/panosvoudouris/storybook-addon-versions> and <https://github.com/tobiashochguertel/storybook-addon-versions> It appears that repo is now defunct and no longer maintained so I've forked it to continue maintenance (eg upgrade for latest storybook etc) and upgrades.
