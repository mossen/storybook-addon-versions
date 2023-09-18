/* eslint-disable function-paren-newline */
/* eslint-disable no-unused-vars */
/* eslint-disable array-callback-return */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable consistent-return */
let configFile: string = null;
let lastFilename: string = null;

/**
 * Retrieves the configuration from the specified file.
 * @param filename - The name of the configuration file. Default value is 'storybook-config.json'.
 * @returns A Promise that resolves to the configuration object.
 */
const getConfig = async (filename: string = 'storybook-config.json'): Promise<any> => {
  if (lastFilename === filename && configFile) {
    return configFile;
  } else if (window && window.parent) {
    lastFilename = filename;
    const url = window.parent.location;
    const pathSegments = url.pathname.split('/').filter((word) => word.length > 1);

    const allLocations: string[] = [];
    const counter = pathSegments.length;
    for (let i = 0; i <= counter; i++) {
      allLocations.push(pathSegments.length > 0 ? pathSegments.join('/') : '/');
      pathSegments.pop();
    }

    const multipleFetches: Promise<Response>[] = [];
    allLocations.forEach((parentPath) => {
      multipleFetches.push(fetch(`${url.protocol}//${url.hostname}:${url.port}/${parentPath}/${filename}`));
    });

    try {
      const responses = await Promise.all(multipleFetches);
      const datas = await Promise.all(
        responses.map(async (response) => {
          if (response.ok) {
            return response.json();
          }
          // throw new Error('Response not ok');
        })
      );

      for (const data of datas) {
        if (data && data.storybook && data.storybook.versions) {
          configFile = data.storybook.versions;
          return configFile;
        }
        // throw new Error('Invalid config');
      }
    } catch (error) {
      // throw new Error('Error getting config');
    }
  } else {
    // throw new Error('Window not found');
  }
};

export default getConfig;
