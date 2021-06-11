import { TFeature, TPaths } from './defs';
import { getActionable } from './util';

export function getSteps(value: string) {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => !s.startsWith('#') && s.length);
}

// Expand backgrounds by prepending 'upper' features to 'lower' features
export async function expandBackgrounds(paths: TPaths, before = '') {
  const expanded: TPaths = {};
  const features = [];
  const nodes = [];
  for (const [path, featureOrNode] of Object.entries(paths)) {
    if (featureOrNode.feature) {
      features.push({ path, feature: featureOrNode });
    } else {
      nodes.push({ path, node: featureOrNode });
    }
  }

  for (const { path, feature } of features) {
    expanded[path] = { feature: `${before}${feature.feature}` };
    before += feature.feature;
  }
  for (const { path, node } of nodes) {
    expanded[path] = await expandBackgrounds(node as TPaths, before ? `${before}\n` : '');
  }
  return expanded;
}

export async function expandFeatures(paths: TPaths, backgrounds: TPaths) {
  const expanded: TPaths = {};

  const features = [];
  const nodes = [];

  for (const [path, featureOrNode] of Object.entries(paths)) {
    if (featureOrNode.feature) {
      features.push({ path, feature: featureOrNode });
    } else if (typeof featureOrNode === 'object') {
      nodes.push({ path, node: featureOrNode });
    } else {
      throw Error(`wrong structure ${paths}`);
    }

    for (const { path, feature } of features) {
      expanded[path] = await expandIncluded(feature as TFeature, backgrounds);
    }
    for (const { path, node } of nodes) {
      expanded[path] = await expandFeatures(node as TPaths, backgrounds);
    }
  }
  return expanded;
}

async function expandIncluded(feature: TFeature, backgrounds: TPaths) {
  const lines = feature.feature
    .split('\n')
    .map((l) => {
      if (getActionable(l).match(/^Backgrounds: .*$/)) {
        return doIncludes(l, backgrounds);
      } else if (getActionable(l).match(/^Scenarios: .*$/)) {
        return doIncludes(l, backgrounds);
      }
      return l;
    })
    .join('\n');

  return { feature: lines };
}

function doIncludes(input: string, backgrounds: TPaths) {
  const includes = input.replace(/^.*?: /, '').split(',');
  let ret = '';
  for (const l of includes) {
    const toFind = l.trim();
    const bg = findFeature(toFind, backgrounds);
    if (!bg || !bg.feature) {
      console.log(JSON.stringify(backgrounds, null, 2));
      throw Error(`can't find "${toFind}" from ${Object.keys(backgrounds).map((b) => JSON.stringify(Object.keys(backgrounds[b]), null, 2))}`);
    }
    ret += `\n${bg?.feature.trim()}\n`;
  }
  return ret;
}

export function findFeature(name: string, features: TPaths): TFeature | undefined {
  for (const [path, featureOrNode] of Object.entries(features)) {
    if (featureOrNode.feature) {
      if (path === name) {
        return featureOrNode as TFeature;
      }
    } else {
      const found = findFeature(name, featureOrNode as TPaths);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
