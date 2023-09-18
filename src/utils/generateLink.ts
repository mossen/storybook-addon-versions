/**
 * Generates a link based on the given location and parameters.
 * 
 * @param location - The location object.
 * @param current - The current string to be replaced in the pathname.
 * @param target - The target string to replace the current string.
 * @param hostname - The hostname to be used in the generated link.
 * @returns The generated link.
 */
const generateLink = (location: Location, current: string, target: string, hostname: string): string => {
  if (location && hostname) {
    let path: string;

    if (current) {
      path = location.pathname.replace(current, target);
    } else if (target) {
      path = `/${target}/`;
    } else {
      path = '/';
    }

    return `${location.protocol}//${hostname}${path}${location.search}${location.hash}`;
  }

  return '#';
};

export default generateLink;