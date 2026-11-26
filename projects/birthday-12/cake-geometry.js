/* polygon-splitter 0.0.11 with browser dependencies. See cake-geometry.LICENSE.txt. */
var CakeGeometry = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // entry.js
  var entry_exports = {};
  __export(entry_exports, {
    split: () => index
  });

  // node_modules/@turf/clone/dist/es/index.js
  function clone(geojson) {
    if (!geojson) {
      throw new Error("geojson is required");
    }
    switch (geojson.type) {
      case "Feature":
        return cloneFeature(geojson);
      case "FeatureCollection":
        return cloneFeatureCollection(geojson);
      case "Point":
      case "LineString":
      case "Polygon":
      case "MultiPoint":
      case "MultiLineString":
      case "MultiPolygon":
      case "GeometryCollection":
        return cloneGeometry(geojson);
      default:
        throw new Error("unknown GeoJSON type");
    }
  }
  function cloneFeature(geojson) {
    var cloned = { type: "Feature" };
    Object.keys(geojson).forEach(function(key) {
      switch (key) {
        case "type":
        case "properties":
        case "geometry":
          return;
        default:
          cloned[key] = geojson[key];
      }
    });
    cloned.properties = cloneProperties(geojson.properties);
    cloned.geometry = cloneGeometry(geojson.geometry);
    return cloned;
  }
  function cloneProperties(properties) {
    var cloned = {};
    if (!properties) {
      return cloned;
    }
    Object.keys(properties).forEach(function(key) {
      var value = properties[key];
      if (typeof value === "object") {
        if (value === null) {
          cloned[key] = null;
        } else if (Array.isArray(value)) {
          cloned[key] = value.map(function(item) {
            return item;
          });
        } else {
          cloned[key] = cloneProperties(value);
        }
      } else {
        cloned[key] = value;
      }
    });
    return cloned;
  }
  function cloneFeatureCollection(geojson) {
    var cloned = { type: "FeatureCollection" };
    Object.keys(geojson).forEach(function(key) {
      switch (key) {
        case "type":
        case "features":
          return;
        default:
          cloned[key] = geojson[key];
      }
    });
    cloned.features = geojson.features.map(function(feature2) {
      return cloneFeature(feature2);
    });
    return cloned;
  }
  function cloneGeometry(geometry) {
    var geom = { type: geometry.type };
    if (geometry.bbox) {
      geom.bbox = geometry.bbox;
    }
    if (geometry.type === "GeometryCollection") {
      geom.geometries = geometry.geometries.map(function(g) {
        return cloneGeometry(g);
      });
      return geom;
    }
    geom.coordinates = deepSlice(geometry.coordinates);
    return geom;
  }
  function deepSlice(coords) {
    var cloned = coords;
    if (typeof cloned[0] !== "object") {
      return cloned.slice();
    }
    return cloned.map(function(coord) {
      return deepSlice(coord);
    });
  }
  var es_default = clone;

  // node_modules/@turf/helpers/dist/es/index.js
  var earthRadius = 63710088e-1;
  var factors = {
    centimeters: earthRadius * 100,
    centimetres: earthRadius * 100,
    degrees: earthRadius / 111325,
    feet: earthRadius * 3.28084,
    inches: earthRadius * 39.37,
    kilometers: earthRadius / 1e3,
    kilometres: earthRadius / 1e3,
    meters: earthRadius,
    metres: earthRadius,
    miles: earthRadius / 1609.344,
    millimeters: earthRadius * 1e3,
    millimetres: earthRadius * 1e3,
    nauticalmiles: earthRadius / 1852,
    radians: 1,
    yards: earthRadius * 1.0936
  };
  var unitsFactors = {
    centimeters: 100,
    centimetres: 100,
    degrees: 1 / 111325,
    feet: 3.28084,
    inches: 39.37,
    kilometers: 1 / 1e3,
    kilometres: 1 / 1e3,
    meters: 1,
    metres: 1,
    miles: 1 / 1609.344,
    millimeters: 1e3,
    millimetres: 1e3,
    nauticalmiles: 1 / 1852,
    radians: 1 / earthRadius,
    yards: 1.0936133
  };
  function featureCollection(features, options) {
    if (options === void 0) {
      options = {};
    }
    var fc = { type: "FeatureCollection" };
    if (options.id) {
      fc.id = options.id;
    }
    if (options.bbox) {
      fc.bbox = options.bbox;
    }
    fc.features = features;
    return fc;
  }
  function isObject(input) {
    return !!input && input.constructor === Object;
  }

  // node_modules/@turf/invariant/dist/es/index.js
  function getCoords(coords) {
    if (Array.isArray(coords)) {
      return coords;
    }
    if (coords.type === "Feature") {
      if (coords.geometry !== null) {
        return coords.geometry.coordinates;
      }
    } else {
      if (coords.coordinates) {
        return coords.coordinates;
      }
    }
    throw new Error("coords must be GeoJSON Feature, Geometry Object or an Array");
  }

  // node_modules/@turf/boolean-clockwise/dist/es/index.js
  function booleanClockwise(line) {
    var ring = getCoords(line);
    var sum3 = 0;
    var i = 1;
    var prev;
    var cur;
    while (i < ring.length) {
      prev = cur || ring[0];
      cur = ring[i];
      sum3 += (cur[0] - prev[0]) * (cur[1] + prev[1]);
      i++;
    }
    return sum3 > 0;
  }

  // node_modules/@turf/meta/dist/es/index.js
  function featureEach(geojson, callback) {
    if (geojson.type === "Feature") {
      callback(geojson, 0);
    } else if (geojson.type === "FeatureCollection") {
      for (var i = 0; i < geojson.features.length; i++) {
        if (callback(geojson.features[i], i) === false) break;
      }
    }
  }
  function geomEach(geojson, callback) {
    var i, j, g, geometry, stopG, geometryMaybeCollection, isGeometryCollection, featureProperties, featureBBox, featureId, featureIndex = 0, isFeatureCollection = geojson.type === "FeatureCollection", isFeature = geojson.type === "Feature", stop = isFeatureCollection ? geojson.features.length : 1;
    for (i = 0; i < stop; i++) {
      geometryMaybeCollection = isFeatureCollection ? geojson.features[i].geometry : isFeature ? geojson.geometry : geojson;
      featureProperties = isFeatureCollection ? geojson.features[i].properties : isFeature ? geojson.properties : {};
      featureBBox = isFeatureCollection ? geojson.features[i].bbox : isFeature ? geojson.bbox : void 0;
      featureId = isFeatureCollection ? geojson.features[i].id : isFeature ? geojson.id : void 0;
      isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === "GeometryCollection" : false;
      stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;
      for (g = 0; g < stopG; g++) {
        geometry = isGeometryCollection ? geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
        if (geometry === null) {
          if (callback(
            null,
            featureIndex,
            featureProperties,
            featureBBox,
            featureId
          ) === false)
            return false;
          continue;
        }
        switch (geometry.type) {
          case "Point":
          case "LineString":
          case "MultiPoint":
          case "Polygon":
          case "MultiLineString":
          case "MultiPolygon": {
            if (callback(
              geometry,
              featureIndex,
              featureProperties,
              featureBBox,
              featureId
            ) === false)
              return false;
            break;
          }
          case "GeometryCollection": {
            for (j = 0; j < geometry.geometries.length; j++) {
              if (callback(
                geometry.geometries[j],
                featureIndex,
                featureProperties,
                featureBBox,
                featureId
              ) === false)
                return false;
            }
            break;
          }
          default:
            throw new Error("Unknown Geometry Type");
        }
      }
      featureIndex++;
    }
  }

  // node_modules/@turf/rewind/dist/es/index.js
  function rewind(geojson, options) {
    options = options || {};
    if (!isObject(options)) throw new Error("options is invalid");
    var reverse = options.reverse || false;
    var mutate = options.mutate || false;
    if (!geojson) throw new Error("<geojson> is required");
    if (typeof reverse !== "boolean")
      throw new Error("<reverse> must be a boolean");
    if (typeof mutate !== "boolean")
      throw new Error("<mutate> must be a boolean");
    if (mutate === false) geojson = es_default(geojson);
    var results = [];
    switch (geojson.type) {
      case "GeometryCollection":
        geomEach(geojson, function(geometry) {
          rewindFeature(geometry, reverse);
        });
        return geojson;
      case "FeatureCollection":
        featureEach(geojson, function(feature2) {
          featureEach(rewindFeature(feature2, reverse), function(result) {
            results.push(result);
          });
        });
        return featureCollection(results);
    }
    return rewindFeature(geojson, reverse);
  }
  function rewindFeature(geojson, reverse) {
    var type = geojson.type === "Feature" ? geojson.geometry.type : geojson.type;
    switch (type) {
      case "GeometryCollection":
        geomEach(geojson, function(geometry) {
          rewindFeature(geometry, reverse);
        });
        return geojson;
      case "LineString":
        rewindLineString(getCoords(geojson), reverse);
        return geojson;
      case "Polygon":
        rewindPolygon(getCoords(geojson), reverse);
        return geojson;
      case "MultiLineString":
        getCoords(geojson).forEach(function(lineCoords) {
          rewindLineString(lineCoords, reverse);
        });
        return geojson;
      case "MultiPolygon":
        getCoords(geojson).forEach(function(lineCoords) {
          rewindPolygon(lineCoords, reverse);
        });
        return geojson;
      case "Point":
      case "MultiPoint":
        return geojson;
    }
  }
  function rewindLineString(coords, reverse) {
    if (booleanClockwise(coords) === reverse) coords.reverse();
  }
  function rewindPolygon(coords, reverse) {
    if (booleanClockwise(coords[0]) !== reverse) {
      coords[0].reverse();
    }
    for (var i = 1; i < coords.length; i++) {
      if (booleanClockwise(coords[i]) === reverse) {
        coords[i].reverse();
      }
    }
  }
  var es_default2 = rewind;

  // node_modules/point-in-polygon-hao/node_modules/robust-predicates/esm/util.js
  var epsilon = 11102230246251565e-32;
  var splitter = 134217729;
  var resulterrbound = (3 + 8 * epsilon) * epsilon;
  function sum(elen, e, flen, f, h) {
    let Q, Qnew, hh, bvirt;
    let enow = e[0];
    let fnow = f[0];
    let eindex = 0;
    let findex = 0;
    if (fnow > enow === fnow > -enow) {
      Q = enow;
      enow = e[++eindex];
    } else {
      Q = fnow;
      fnow = f[++findex];
    }
    let hindex = 0;
    if (eindex < elen && findex < flen) {
      if (fnow > enow === fnow > -enow) {
        Qnew = enow + Q;
        hh = Q - (Qnew - enow);
        enow = e[++eindex];
      } else {
        Qnew = fnow + Q;
        hh = Q - (Qnew - fnow);
        fnow = f[++findex];
      }
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
      while (eindex < elen && findex < flen) {
        if (fnow > enow === fnow > -enow) {
          Qnew = Q + enow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (enow - bvirt);
          enow = e[++eindex];
        } else {
          Qnew = Q + fnow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (fnow - bvirt);
          fnow = f[++findex];
        }
        Q = Qnew;
        if (hh !== 0) {
          h[hindex++] = hh;
        }
      }
    }
    while (eindex < elen) {
      Qnew = Q + enow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (enow - bvirt);
      enow = e[++eindex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    while (findex < flen) {
      Qnew = Q + fnow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (fnow - bvirt);
      fnow = f[++findex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    if (Q !== 0 || hindex === 0) {
      h[hindex++] = Q;
    }
    return hindex;
  }
  function estimate(elen, e) {
    let Q = e[0];
    for (let i = 1; i < elen; i++) Q += e[i];
    return Q;
  }
  function vec(n) {
    return new Float64Array(n);
  }

  // node_modules/point-in-polygon-hao/node_modules/robust-predicates/esm/orient2d.js
  var ccwerrboundA = (3 + 16 * epsilon) * epsilon;
  var ccwerrboundB = (2 + 12 * epsilon) * epsilon;
  var ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;
  var B = vec(4);
  var C1 = vec(8);
  var C2 = vec(12);
  var D = vec(16);
  var u = vec(4);
  function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
    let acxtail, acytail, bcxtail, bcytail;
    let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u32;
    const acx = ax - cx;
    const bcx = bx - cx;
    const acy = ay - cy;
    const bcy = by - cy;
    s1 = acx * bcy;
    c = splitter * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcx;
    c = splitter * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    B[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    B[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    B[2] = _j - (u32 - bvirt) + (_i - bvirt);
    B[3] = u32;
    let det = estimate(4, B);
    let errbound = ccwerrboundB * detsum;
    if (det >= errbound || -det >= errbound) {
      return det;
    }
    bvirt = ax - acx;
    acxtail = ax - (acx + bvirt) + (bvirt - cx);
    bvirt = bx - bcx;
    bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
    bvirt = ay - acy;
    acytail = ay - (acy + bvirt) + (bvirt - cy);
    bvirt = by - bcy;
    bcytail = by - (bcy + bvirt) + (bvirt - cy);
    if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
      return det;
    }
    errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
    det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
    if (det >= errbound || -det >= errbound) return det;
    s1 = acxtail * bcy;
    c = splitter * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcx;
    c = splitter * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const C1len = sum(4, B, 4, u, C1);
    s1 = acx * bcytail;
    c = splitter * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcxtail;
    c = splitter * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const C2len = sum(C1len, C1, 4, u, C2);
    s1 = acxtail * bcytail;
    c = splitter * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcxtail;
    c = splitter * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const Dlen = sum(C2len, C2, 4, u, D);
    return D[Dlen - 1];
  }
  function orient2d(ax, ay, bx, by, cx, cy) {
    const detleft = (ay - cy) * (bx - cx);
    const detright = (ax - cx) * (by - cy);
    const det = detleft - detright;
    const detsum = Math.abs(detleft + detright);
    if (Math.abs(det) >= ccwerrboundA * detsum) return det;
    return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
  }

  // node_modules/point-in-polygon-hao/node_modules/robust-predicates/esm/orient3d.js
  var o3derrboundA = (7 + 56 * epsilon) * epsilon;
  var o3derrboundB = (3 + 28 * epsilon) * epsilon;
  var o3derrboundC = (26 + 288 * epsilon) * epsilon * epsilon;
  var bc = vec(4);
  var ca = vec(4);
  var ab = vec(4);
  var at_b = vec(4);
  var at_c = vec(4);
  var bt_c = vec(4);
  var bt_a = vec(4);
  var ct_a = vec(4);
  var ct_b = vec(4);
  var bct = vec(8);
  var cat = vec(8);
  var abt = vec(8);
  var u2 = vec(4);
  var _8 = vec(8);
  var _8b = vec(8);
  var _16 = vec(16);
  var _12 = vec(12);
  var fin = vec(192);
  var fin2 = vec(192);

  // node_modules/point-in-polygon-hao/node_modules/robust-predicates/esm/incircle.js
  var iccerrboundA = (10 + 96 * epsilon) * epsilon;
  var iccerrboundB = (4 + 48 * epsilon) * epsilon;
  var iccerrboundC = (44 + 576 * epsilon) * epsilon * epsilon;
  var bc2 = vec(4);
  var ca2 = vec(4);
  var ab2 = vec(4);
  var aa = vec(4);
  var bb = vec(4);
  var cc = vec(4);
  var u3 = vec(4);
  var v = vec(4);
  var axtbc = vec(8);
  var aytbc = vec(8);
  var bxtca = vec(8);
  var bytca = vec(8);
  var cxtab = vec(8);
  var cytab = vec(8);
  var abt2 = vec(8);
  var bct2 = vec(8);
  var cat2 = vec(8);
  var abtt = vec(4);
  var bctt = vec(4);
  var catt = vec(4);
  var _82 = vec(8);
  var _162 = vec(16);
  var _16b = vec(16);
  var _16c = vec(16);
  var _32 = vec(32);
  var _32b = vec(32);
  var _48 = vec(48);
  var _64 = vec(64);
  var fin3 = vec(1152);
  var fin22 = vec(1152);

  // node_modules/point-in-polygon-hao/node_modules/robust-predicates/esm/insphere.js
  var isperrboundA = (16 + 224 * epsilon) * epsilon;
  var isperrboundB = (5 + 72 * epsilon) * epsilon;
  var isperrboundC = (71 + 1408 * epsilon) * epsilon * epsilon;
  var ab3 = vec(4);
  var bc3 = vec(4);
  var cd = vec(4);
  var de = vec(4);
  var ea = vec(4);
  var ac = vec(4);
  var bd = vec(4);
  var ce = vec(4);
  var da = vec(4);
  var eb = vec(4);
  var abc = vec(24);
  var bcd = vec(24);
  var cde = vec(24);
  var dea = vec(24);
  var eab = vec(24);
  var abd = vec(24);
  var bce = vec(24);
  var cda = vec(24);
  var deb = vec(24);
  var eac = vec(24);
  var adet = vec(1152);
  var bdet = vec(1152);
  var cdet = vec(1152);
  var ddet = vec(1152);
  var edet = vec(1152);
  var abdet = vec(2304);
  var cddet = vec(2304);
  var cdedet = vec(3456);
  var deter = vec(5760);
  var _83 = vec(8);
  var _8b2 = vec(8);
  var _8c = vec(8);
  var _163 = vec(16);
  var _24 = vec(24);
  var _482 = vec(48);
  var _48b = vec(48);
  var _96 = vec(96);
  var _192 = vec(192);
  var _384x = vec(384);
  var _384y = vec(384);
  var _384z = vec(384);
  var _768 = vec(768);
  var xdet = vec(96);
  var ydet = vec(96);
  var zdet = vec(96);
  var fin4 = vec(1152);

  // node_modules/point-in-polygon-hao/dist/esm/index.js
  function pointInPolygon(p, polygon) {
    var i;
    var ii;
    var k = 0;
    var f;
    var u1;
    var v1;
    var u22;
    var v22;
    var currentP;
    var nextP;
    var x = p[0];
    var y = p[1];
    var numContours = polygon.length;
    for (i = 0; i < numContours; i++) {
      ii = 0;
      var contour = polygon[i];
      var contourLen = contour.length - 1;
      currentP = contour[0];
      if (currentP[0] !== contour[contourLen][0] && currentP[1] !== contour[contourLen][1]) {
        throw new Error("First and last coordinates in a ring must be the same");
      }
      u1 = currentP[0] - x;
      v1 = currentP[1] - y;
      for (ii; ii < contourLen; ii++) {
        nextP = contour[ii + 1];
        u22 = nextP[0] - x;
        v22 = nextP[1] - y;
        if (v1 === 0 && v22 === 0) {
          if (u22 <= 0 && u1 >= 0 || u1 <= 0 && u22 >= 0) {
            return 0;
          }
        } else if (v22 >= 0 && v1 <= 0 || v22 <= 0 && v1 >= 0) {
          f = orient2d(u1, u22, v1, v22, 0, 0);
          if (f === 0) {
            return 0;
          }
          if (f > 0 && v22 > 0 && v1 <= 0 || f < 0 && v22 <= 0 && v1 > 0) {
            k++;
          }
        }
        currentP = nextP;
        v1 = v22;
        u1 = u22;
      }
    }
    if (k % 2 === 0) {
      return false;
    }
    return true;
  }

  // node_modules/robust-predicates/esm/util.js
  var epsilon2 = 11102230246251565e-32;
  var splitter2 = 134217729;
  var resulterrbound2 = (3 + 8 * epsilon2) * epsilon2;
  function sum2(elen, e, flen, f, h) {
    let Q, Qnew, hh, bvirt;
    let enow = e[0];
    let fnow = f[0];
    let eindex = 0;
    let findex = 0;
    if (fnow > enow === fnow > -enow) {
      Q = enow;
      enow = e[++eindex];
    } else {
      Q = fnow;
      fnow = f[++findex];
    }
    let hindex = 0;
    if (eindex < elen && findex < flen) {
      if (fnow > enow === fnow > -enow) {
        Qnew = enow + Q;
        hh = Q - (Qnew - enow);
        enow = e[++eindex];
      } else {
        Qnew = fnow + Q;
        hh = Q - (Qnew - fnow);
        fnow = f[++findex];
      }
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
      while (eindex < elen && findex < flen) {
        if (fnow > enow === fnow > -enow) {
          Qnew = Q + enow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (enow - bvirt);
          enow = e[++eindex];
        } else {
          Qnew = Q + fnow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (fnow - bvirt);
          fnow = f[++findex];
        }
        Q = Qnew;
        if (hh !== 0) {
          h[hindex++] = hh;
        }
      }
    }
    while (eindex < elen) {
      Qnew = Q + enow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (enow - bvirt);
      enow = e[++eindex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    while (findex < flen) {
      Qnew = Q + fnow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (fnow - bvirt);
      fnow = f[++findex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    if (Q !== 0 || hindex === 0) {
      h[hindex++] = Q;
    }
    return hindex;
  }
  function estimate2(elen, e) {
    let Q = e[0];
    for (let i = 1; i < elen; i++) Q += e[i];
    return Q;
  }
  function vec2(n) {
    return new Float64Array(n);
  }

  // node_modules/robust-predicates/esm/orient2d.js
  var ccwerrboundA2 = (3 + 16 * epsilon2) * epsilon2;
  var ccwerrboundB2 = (2 + 12 * epsilon2) * epsilon2;
  var ccwerrboundC2 = (9 + 64 * epsilon2) * epsilon2 * epsilon2;
  var B2 = vec2(4);
  var C12 = vec2(8);
  var C22 = vec2(12);
  var D2 = vec2(16);
  var u4 = vec2(4);
  function orient2dadapt2(ax, ay, bx, by, cx, cy, detsum) {
    let acxtail, acytail, bcxtail, bcytail;
    let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u32;
    const acx = ax - cx;
    const bcx = bx - cx;
    const acy = ay - cy;
    const bcy = by - cy;
    s1 = acx * bcy;
    c = splitter2 * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter2 * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcx;
    c = splitter2 * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter2 * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    B2[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    B2[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    B2[2] = _j - (u32 - bvirt) + (_i - bvirt);
    B2[3] = u32;
    let det = estimate2(4, B2);
    let errbound = ccwerrboundB2 * detsum;
    if (det >= errbound || -det >= errbound) {
      return det;
    }
    bvirt = ax - acx;
    acxtail = ax - (acx + bvirt) + (bvirt - cx);
    bvirt = bx - bcx;
    bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
    bvirt = ay - acy;
    acytail = ay - (acy + bvirt) + (bvirt - cy);
    bvirt = by - bcy;
    bcytail = by - (bcy + bvirt) + (bvirt - cy);
    if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
      return det;
    }
    errbound = ccwerrboundC2 * detsum + resulterrbound2 * Math.abs(det);
    det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
    if (det >= errbound || -det >= errbound) return det;
    s1 = acxtail * bcy;
    c = splitter2 * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter2 * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcx;
    c = splitter2 * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter2 * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u4[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u4[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u4[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u4[3] = u32;
    const C1len = sum2(4, B2, 4, u4, C12);
    s1 = acx * bcytail;
    c = splitter2 * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter2 * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcxtail;
    c = splitter2 * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter2 * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u4[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u4[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u4[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u4[3] = u32;
    const C2len = sum2(C1len, C12, 4, u4, C22);
    s1 = acxtail * bcytail;
    c = splitter2 * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter2 * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcxtail;
    c = splitter2 * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter2 * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u4[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u4[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u4[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u4[3] = u32;
    const Dlen = sum2(C2len, C22, 4, u4, D2);
    return D2[Dlen - 1];
  }
  function orient2d2(ax, ay, bx, by, cx, cy) {
    const detleft = (ay - cy) * (bx - cx);
    const detright = (ax - cx) * (by - cy);
    const det = detleft - detright;
    if (detleft === 0 || detright === 0 || detleft > 0 !== detright > 0) return det;
    const detsum = Math.abs(detleft + detright);
    if (Math.abs(det) >= ccwerrboundA2 * detsum) return det;
    return -orient2dadapt2(ax, ay, bx, by, cx, cy, detsum);
  }

  // node_modules/robust-predicates/esm/orient3d.js
  var o3derrboundA2 = (7 + 56 * epsilon2) * epsilon2;
  var o3derrboundB2 = (3 + 28 * epsilon2) * epsilon2;
  var o3derrboundC2 = (26 + 288 * epsilon2) * epsilon2 * epsilon2;
  var bc4 = vec2(4);
  var ca3 = vec2(4);
  var ab4 = vec2(4);
  var at_b2 = vec2(4);
  var at_c2 = vec2(4);
  var bt_c2 = vec2(4);
  var bt_a2 = vec2(4);
  var ct_a2 = vec2(4);
  var ct_b2 = vec2(4);
  var bct3 = vec2(8);
  var cat3 = vec2(8);
  var abt3 = vec2(8);
  var u5 = vec2(4);
  var _84 = vec2(8);
  var _8b3 = vec2(8);
  var _164 = vec2(8);
  var _122 = vec2(12);
  var fin5 = vec2(192);
  var fin23 = vec2(192);

  // node_modules/robust-predicates/esm/incircle.js
  var iccerrboundA2 = (10 + 96 * epsilon2) * epsilon2;
  var iccerrboundB2 = (4 + 48 * epsilon2) * epsilon2;
  var iccerrboundC2 = (44 + 576 * epsilon2) * epsilon2 * epsilon2;
  var bc5 = vec2(4);
  var ca4 = vec2(4);
  var ab5 = vec2(4);
  var aa2 = vec2(4);
  var bb2 = vec2(4);
  var cc2 = vec2(4);
  var u6 = vec2(4);
  var v2 = vec2(4);
  var axtbc2 = vec2(8);
  var aytbc2 = vec2(8);
  var bxtca2 = vec2(8);
  var bytca2 = vec2(8);
  var cxtab2 = vec2(8);
  var cytab2 = vec2(8);
  var abt4 = vec2(8);
  var bct4 = vec2(8);
  var cat4 = vec2(8);
  var abtt2 = vec2(4);
  var bctt2 = vec2(4);
  var catt2 = vec2(4);
  var _85 = vec2(8);
  var _165 = vec2(16);
  var _16b2 = vec2(16);
  var _16c2 = vec2(16);
  var _322 = vec2(32);
  var _32b2 = vec2(32);
  var _483 = vec2(48);
  var _642 = vec2(64);
  var fin6 = vec2(1152);
  var fin24 = vec2(1152);

  // node_modules/robust-predicates/esm/insphere.js
  var isperrboundA2 = (16 + 224 * epsilon2) * epsilon2;
  var isperrboundB2 = (5 + 72 * epsilon2) * epsilon2;
  var isperrboundC2 = (71 + 1408 * epsilon2) * epsilon2 * epsilon2;
  var ab6 = vec2(4);
  var bc6 = vec2(4);
  var cd2 = vec2(4);
  var de2 = vec2(4);
  var ea2 = vec2(4);
  var ac2 = vec2(4);
  var bd2 = vec2(4);
  var ce2 = vec2(4);
  var da2 = vec2(4);
  var eb2 = vec2(4);
  var abc2 = vec2(24);
  var bcd2 = vec2(24);
  var cde2 = vec2(24);
  var dea2 = vec2(24);
  var eab2 = vec2(24);
  var abd2 = vec2(24);
  var bce2 = vec2(24);
  var cda2 = vec2(24);
  var deb2 = vec2(24);
  var eac2 = vec2(24);
  var adet2 = vec2(1152);
  var bdet2 = vec2(1152);
  var cdet2 = vec2(1152);
  var ddet2 = vec2(1152);
  var edet2 = vec2(1152);
  var abdet2 = vec2(2304);
  var cddet2 = vec2(2304);
  var cdedet2 = vec2(3456);
  var deter2 = vec2(5760);
  var _86 = vec2(8);
  var _8b4 = vec2(8);
  var _8c2 = vec2(8);
  var _166 = vec2(16);
  var _242 = vec2(24);
  var _484 = vec2(48);
  var _48b2 = vec2(48);
  var _962 = vec2(96);
  var _1922 = vec2(192);
  var _384x2 = vec2(384);
  var _384y2 = vec2(384);
  var _384z2 = vec2(384);
  var _7682 = vec2(768);
  var xdet2 = vec2(96);
  var ydet2 = vec2(96);
  var zdet2 = vec2(96);
  var fin7 = vec2(1152);

  // node_modules/polygon-splitter/dist/polygonsplitter.mjs
  var Edge = function Edge2(p1, p2, edgeType, index2, contourId) {
    this.p1 = p1;
    this.p2 = p2;
    this.edgeType = edgeType;
    this.originalIndex = index2;
    this.polygonContourId = contourId;
    this.interiorRing = false;
    this.minX = Math.min(p1.p[0], p2.p[0]);
    this.minY = Math.min(p1.p[1], p2.p[1]);
    this.maxX = Math.max(p1.p[0], p2.p[0]);
    this.maxY = Math.max(p1.p[1], p2.p[1]);
    this.intersectionPoints = [];
    this.nextEdge = null;
  };
  var Point = function Point2(p) {
    this.p = p;
  };
  var Contour = function Contour2(contourId, coords) {
    this.id = contourId;
    this.rawCoords = coords;
  };
  function fillQueue(polygon, line, polyEdges, lineEdges, polylineBbox) {
    var numberOfRingsInPolygon = 0;
    var contours = [];
    var linegeom = line.type === "Feature" ? line.geometry : line;
    var linecoords = linegeom.type === "LineString" ? [linegeom.coordinates] : linegeom.coordinates;
    var edgeCount = 0;
    for (var i = 0; i < linecoords.length; i++) {
      var lineLength = linecoords[i].length - 1;
      var p1 = new Point(linecoords[i][0]);
      var p2 = null;
      var prevEdge = { nextEdge: null };
      for (var ii = 0; ii < lineLength; ii++) {
        p2 = new Point(linecoords[i][ii + 1]);
        p1.nextPoint = p2;
        p2.prevPoint = p1;
        var e = new Edge(p1, p2, "polyline", edgeCount, null);
        lineEdges.push(e);
        prevEdge.nextEdge = e;
        e.prevEdge = prevEdge;
        polylineBbox[0] = Math.min(polylineBbox[0], p1.p[0]);
        polylineBbox[1] = Math.min(polylineBbox[1], p1.p[1]);
        polylineBbox[2] = Math.max(polylineBbox[2], p1.p[0]);
        polylineBbox[3] = Math.max(polylineBbox[3], p1.p[1]);
        p1 = p2;
        edgeCount = edgeCount + 1;
        prevEdge = e;
      }
      polylineBbox[0] = Math.min(polylineBbox[0], linecoords[i][lineLength][0]);
      polylineBbox[1] = Math.min(polylineBbox[1], linecoords[i][lineLength][1]);
      polylineBbox[2] = Math.max(polylineBbox[2], linecoords[i][lineLength][0]);
      polylineBbox[3] = Math.max(polylineBbox[3], linecoords[i][lineLength][1]);
    }
    var polygeom = polygon.type === "Feature" ? polygon.geometry : polygon;
    var polycoords = polygeom.type === "Polygon" ? [polygeom.coordinates] : polygeom.coordinates;
    var polyLength = polycoords.length;
    for (var i$1 = 0; i$1 < polyLength; i$1++) {
      var polyLenth2 = polycoords[i$1].length;
      for (var ii$1 = 0; ii$1 < polyLenth2; ii$1++) {
        numberOfRingsInPolygon = numberOfRingsInPolygon + 1;
        var polygonSet = polycoords[i$1][ii$1];
        var polyLenth3 = polygonSet.length;
        contours.push(new Contour(numberOfRingsInPolygon, polygonSet));
        var firstPoint = new Point(polygonSet[0]);
        var p1$1 = firstPoint;
        var p2$1 = void 0, e$1 = null;
        var prevEdge$1 = { nextEdge: null, prevEdge: null };
        var firstEdge = null;
        for (var iii = 1; iii < polyLenth3; iii++) {
          p2$1 = new Point(polygonSet[iii]);
          p1$1.nextPoint = p2$1;
          p2$1.prevPoint = p1$1;
          e$1 = new Edge(p1$1, p2$1, "polygon", edgeCount, numberOfRingsInPolygon);
          prevEdge$1.nextEdge = e$1;
          e$1.prevEdge = prevEdge$1;
          if (iii === 1) {
            firstEdge = e$1;
          }
          if (ii$1 > 0) {
            e$1.interiorRing = true;
          }
          e$1.intersectPolylineBbox = edgeIntersectsBbox(e$1, polylineBbox);
          polyEdges.push(e$1);
          p1$1 = p2$1;
          edgeCount = edgeCount + 1;
          prevEdge$1 = e$1;
        }
        e$1.nextEdge = firstEdge;
        firstEdge.prevEdge = e$1;
        p2$1.nextPoint = firstPoint.nextPoint;
        firstPoint.prevPoint = p2$1.prevPoint;
      }
    }
    return contours;
  }
  function edgeIntersectsBbox(edge, bbox) {
    if (edge.maxX < bbox[0]) {
      return false;
    }
    if (edge.minX > bbox[2]) {
      return false;
    }
    if (edge.maxY < bbox[1]) {
      return false;
    }
    if (edge.minY > bbox[3]) {
      return false;
    }
    return true;
  }
  var IntersectionPoint = function IntersectionPoint2(p, edge1, edge2, isHeadingIn) {
    this.p = p;
    this.polylineEdge = edge1;
    this.polygonEdge = edge2;
    this.isHeadingIn = isHeadingIn;
    this.distanceFromPolylineEdgeStart = distance(this.polylineEdge.p1.p, this.p);
    this.distanceFromPolygonEdgeStart = distance(this.polygonEdge.p1.p, this.p);
    this.polygonEdge.intersectionPoints.push(this);
    this.polylineEdge.intersectionPoints.push(this);
    this.visitCount = 0;
  };
  IntersectionPoint.prototype.incrementVisitCount = function incrementVisitCount() {
    this.visitCount = this.visitCount + 1;
  };
  function distance(p1, p2) {
    var xs = p2[0] - p1[0];
    var ys = p2[1] - p1[1];
    xs *= xs;
    ys *= ys;
    return Math.sqrt(xs + ys);
  }
  function findIntersectionPoints(polygonEdges, lineEdges, intersectingPoints) {
    var i, ii, iii;
    var count = lineEdges.length;
    var polyCount = polygonEdges.length;
    for (i = 0; i < count; i++) {
      var lineEdge = lineEdges[i];
      for (ii = 0; ii < polyCount; ii++) {
        var polygonEdge = polygonEdges[ii];
        if (!polygonEdge.intersectPolylineBbox) {
          continue;
        }
        if (polygonEdge.maxX < lineEdge.minX || polygonEdge.minX > lineEdge.maxX) {
          continue;
        }
        if (polygonEdge.maxY < lineEdge.minY || polygonEdge.minY > lineEdge.maxY) {
          continue;
        }
        var intersection = getEdgeIntersection(lineEdge, polygonEdge);
        if (intersection !== null) {
          for (iii = 0; iii < intersection.length; iii++) {
            var isHeadingIn = orient2d2(polygonEdge.p1.p[0], polygonEdge.p1.p[1], polygonEdge.p2.p[0], polygonEdge.p2.p[1], lineEdge.p1.p[0], lineEdge.p1.p[1]);
            var ip = new IntersectionPoint(intersection[iii], lineEdge, polygonEdge, isHeadingIn > 0);
            intersectingPoints.push(ip);
          }
        }
      }
    }
    lineEdges.forEach(function(edge) {
      edge.intersectionPoints.sort(function(a, b) {
        return a.distanceFromPolylineEdgeStart - b.distanceFromPolylineEdgeStart;
      });
    });
    polygonEdges.forEach(function(edge) {
      edge.intersectionPoints.sort(function(a, b) {
        return a.distanceFromPolygonEdgeStart - b.distanceFromPolygonEdgeStart;
      });
    });
  }
  var EPSILON = 1e-9;
  function crossProduct(a, b) {
    return a[0] * b[1] - a[1] * b[0];
  }
  function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function toPoint(p, s, d) {
    return [
      p[0] + s * d[0],
      p[1] + s * d[1]
    ];
  }
  function getEdgeIntersection(lineEdge, potentialEdge, noEndpointTouch) {
    var va = [lineEdge.p2.p[0] - lineEdge.p1.p[0], lineEdge.p2.p[1] - lineEdge.p1.p[1]];
    var vb = [potentialEdge.p2.p[0] - potentialEdge.p1.p[0], potentialEdge.p2.p[1] - potentialEdge.p1.p[1]];
    var e = [potentialEdge.p1.p[0] - lineEdge.p1.p[0], potentialEdge.p1.p[1] - lineEdge.p1.p[1]];
    var kross = crossProduct(va, vb);
    var sqrKross = kross * kross;
    var sqrLenA = dotProduct(va, va);
    if (sqrKross > 0) {
      var s = crossProduct(e, vb) / kross;
      if (s < 0 || s > 1) {
        return null;
      }
      var t = crossProduct(e, va) / kross;
      if (t < 0 || t > 1) {
        return null;
      }
      if (s === 0 || s === 1) {
        return noEndpointTouch ? null : [toPoint(lineEdge.p1.p, s, va)];
      }
      if (t === 0 || t === 1) {
        return noEndpointTouch ? null : [toPoint(potentialEdge.p1.p, t, vb)];
      }
      return [toPoint(lineEdge.p1.p, s, va)];
    }
    var sqrLenE = dotProduct(e, e);
    kross = crossProduct(e, va);
    sqrKross = kross * kross;
    if (sqrKross > EPSILON * sqrLenA * sqrLenE) {
      return null;
    }
    var sa = dotProduct(va, e) / sqrLenA;
    var sb = sa + dotProduct(va, vb) / sqrLenA;
    var smin = Math.min(sa, sb);
    var smax = Math.max(sa, sb);
    if (smin <= 1 && smax >= 0) {
      if (smin === 1) {
        return noEndpointTouch ? null : [toPoint(lineEdge.p1.p, smin > 0 ? smin : 0, va)];
      }
      if (smax === 0) {
        return noEndpointTouch ? null : [toPoint(lineEdge.p1.p, smax < 1 ? smax : 1, va)];
      }
      if (noEndpointTouch && smin === 0 && smax === 1) {
        return null;
      }
      return [
        toPoint(lineEdge.p1.p, smin > 0 ? smin : 0, va),
        toPoint(lineEdge.p1.p, smax < 1 ? smax : 1, va)
      ];
    }
    return null;
  }
  function index(polygon, line) {
    var poly = es_default2(polygon);
    var intersections = [];
    var polygonEdges = [];
    var polylineEdges = [];
    var polylineBbox = [Infinity, Infinity, Infinity, Infinity];
    var contours = fillQueue(poly, line, polygonEdges, polylineEdges, polylineBbox);
    findIntersectionPoints(polygonEdges, polylineEdges, intersections);
    if (intersections.length === 0) {
      return polygon;
    }
    var numberIntersectionsByRing = {};
    contours.forEach(function(c) {
      return numberIntersectionsByRing[c.id] = 0;
    });
    intersections.forEach(function(i) {
      var id = i.polygonEdge.polygonContourId;
      numberIntersectionsByRing[id] = numberIntersectionsByRing[id] + 1;
    });
    var infiniteLoopGuard = 0;
    var outPolys = [];
    var firstPolyStart = null;
    for (var index2 = 0; index2 < polylineEdges.length; index2++) {
      var pe = polylineEdges[index2];
      if (pe.intersectionPoints.length > 0) {
        firstPolyStart = pe.intersectionPoints[0];
        break;
      }
    }
    var polyStart = firstPolyStart;
    var nextPolyStart = { visitCount: 1 };
    while (firstPolyStart !== nextPolyStart) {
      if (infiniteLoopGuard > intersections.length * 2) {
        break;
      }
      infiniteLoopGuard = infiniteLoopGuard++;
      if (nextPolyStart.visitCount >= 2) {
        var unvisitedPolyFound = false;
        for (var index$1 = 0; index$1 < intersections.length; index$1++) {
          var intersection = intersections[index$1];
          if (intersection.visitCount < 2) {
            polyStart = intersection;
            unvisitedPolyFound = true;
            break;
          }
        }
        if (!unvisitedPolyFound) {
          break;
        }
      }
      polyStart.visitCount = polyStart.visitCount + 1;
      var outPoly = [];
      outPolys.push(outPoly);
      outPoly.push(polyStart.p);
      polyStart.visitCount = polyStart.visitCount + 1;
      var nextIntersection = walkPolygonForwards(polyStart, outPoly);
      nextPolyStart = nextIntersection;
      var override = false;
      if (nextIntersection === nextPolyStart && intersections.length === 2) {
        for (var index$2 = 0; index$2 < intersections.length; index$2++) {
          var intersection$1 = intersections[index$2];
          if (intersection$1.visitCount < 2) {
            override = true;
          }
        }
      }
      while (nextIntersection !== polyStart || override) {
        var methodForPolyline = nextIntersection.isHeadingIn ? walkPolylineForwards : walkPolylineBackwards;
        nextIntersection = methodForPolyline(nextIntersection, outPoly);
        if (nextIntersection !== polyStart) {
          nextIntersection = walkPolygonForwards(nextIntersection, outPoly);
        }
        override = false;
      }
      if (nextPolyStart.visitCount >= 2) {
        var unvisitedPolyFound$1 = false;
        for (var index$3 = 0; index$3 < intersections.length; index$3++) {
          var intersection$2 = intersections[index$3];
          if (intersection$2.visitCount < 2) {
            polyStart = intersection$2;
            unvisitedPolyFound$1 = true;
            break;
          }
        }
        if (unvisitedPolyFound$1) {
          nextPolyStart = polyStart;
        }
      }
      polyStart = nextPolyStart;
    }
    var outCoordinates = outPolys.map(function(poly2) {
      return [poly2];
    });
    var keys = Object.keys(numberIntersectionsByRing);
    for (var index$4 = 0; index$4 < keys.length; index$4++) {
      var key = keys[index$4];
      var value = numberIntersectionsByRing[key];
      if (value === 0) {
        var edge = findFirstPolygonEdge(polygonEdges, parseInt(key));
        var ring = findRingFromEdge(edge, contours);
        createAsHoleOrAddAsNewOuterRing(ring, outCoordinates);
      }
    }
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: outCoordinates
      }
    };
  }
  function findFirstPolygonEdge(polygonEdges, contourId) {
    for (var index2 = 0; index2 < polygonEdges.length; index2++) {
      var edge = polygonEdges[index2];
      if (edge.polygonContourId === contourId) {
        return edge;
      }
    }
  }
  function findRingFromEdge(edge, contours) {
    var contour = contours.find(function(c) {
      return c.id === edge.polygonContourId;
    });
    return contour.rawCoords;
  }
  function createAsHoleOrAddAsNewOuterRing(unusedRing, outCoordinates) {
    for (var index2 = 0; index2 < outCoordinates.length; index2++) {
      var existingRing = outCoordinates[index2];
      if (pointInPolygon(unusedRing[0], [existingRing[0]])) {
        existingRing.push(unusedRing);
        return;
      }
    }
    outCoordinates.push([unusedRing]);
  }
  function walkPolygonForwards(intersectionPoint, outPoly) {
    var nextEdge = intersectionPoint.polygonEdge;
    if (nextEdge.intersectionPoints.length > 1) {
      var lastPointOnEdge = nextEdge.intersectionPoints[nextEdge.intersectionPoints.length - 1];
      if (lastPointOnEdge !== intersectionPoint) {
        var currentIndex = findIndexOfIntersectionPoint(intersectionPoint, nextEdge.intersectionPoints);
        var nextIp = nextEdge.intersectionPoints[currentIndex + 1];
        outPoly.push(nextIp.p);
        nextIp.incrementVisitCount();
        return nextIp;
      }
    }
    var condition = true;
    while (condition) {
      outPoly.push(nextEdge.p2.p);
      nextEdge = nextEdge.nextEdge;
      if (nextEdge === null) {
        return intersectionPoint;
      } else if (nextEdge.intersectionPoints.length > 0) {
        condition = false;
      }
    }
    nextEdge.intersectionPoints[0].incrementVisitCount();
    outPoly.push(nextEdge.intersectionPoints[0].p);
    return nextEdge.intersectionPoints[0];
  }
  function findIndexOfIntersectionPoint(intersection, intersections) {
    for (var index2 = 0; index2 < intersections.length; index2++) {
      var int = intersections[index2];
      if (int === intersection) {
        return index2;
      }
    }
    return null;
  }
  function walkPolylineBackwards(intersectionPoint, outPoly) {
    var nextEdge = intersectionPoint.polylineEdge;
    if (nextEdge.intersectionPoints.length === 2) {
      var lastPointOnEdge = nextEdge.intersectionPoints[nextEdge.intersectionPoints.length - 1];
      if (lastPointOnEdge === intersectionPoint) {
        var nextIntersection = nextEdge.intersectionPoints[0];
        outPoly.push(nextIntersection.p);
        nextIntersection.incrementVisitCount();
        return nextIntersection;
      } else {
        outPoly.push(lastPointOnEdge.p);
        lastPointOnEdge.incrementVisitCount();
        return lastPointOnEdge;
      }
    } else if (nextEdge.intersectionPoints.length > 2) {
      var lastPointOnEdge$1 = nextEdge.intersectionPoints[0];
      if (lastPointOnEdge$1 !== intersectionPoint) {
        var currentIndex = findIndexOfIntersectionPoint(intersectionPoint, nextEdge.intersectionPoints);
        var nextIntersection$1 = nextEdge.intersectionPoints[currentIndex - 1];
        outPoly.push(nextIntersection$1.p);
        nextIntersection$1.incrementVisitCount();
        return nextIntersection$1;
      }
    }
    var condition = true;
    while (condition) {
      outPoly.push(nextEdge.p1.p);
      nextEdge = nextEdge.prevEdge;
      if (nextEdge.originalIndex === void 0) {
        return intersectionPoint;
      } else if (nextEdge.intersectionPoints.length > 0) {
        condition = false;
      }
    }
    if (nextEdge.originalIndex === void 0) {
      return intersectionPoint;
    }
    var lastIntersection = nextEdge.intersectionPoints[nextEdge.intersectionPoints.length - 1];
    lastIntersection.incrementVisitCount();
    outPoly.push(lastIntersection.p);
    return lastIntersection;
  }
  function walkPolylineForwards(intersectionPoint, outPoly) {
    var nextEdge = intersectionPoint.polylineEdge;
    if (nextEdge.intersectionPoints.length > 1) {
      var lastPointOnEdge = nextEdge.intersectionPoints[nextEdge.intersectionPoints.length - 1];
      if (lastPointOnEdge !== intersectionPoint) {
        var currentIndex = findIndexOfIntersectionPoint(intersectionPoint, nextEdge.intersectionPoints);
        var nextIp = nextEdge.intersectionPoints[currentIndex + 1];
        outPoly.push(nextIp.p);
        nextIp.incrementVisitCount();
        return nextIp;
      }
    }
    var condition = true;
    while (condition) {
      outPoly.push(nextEdge.p2.p);
      nextEdge = nextEdge.nextEdge;
      if (nextEdge === null) {
        return intersectionPoint;
      } else if (nextEdge.intersectionPoints.length > 0) {
        condition = false;
      }
    }
    if (nextEdge === void 0) {
      return intersectionPoint;
    }
    var lastIntersection = nextEdge.intersectionPoints[0];
    lastIntersection.incrementVisitCount();
    outPoly.push(lastIntersection.p);
    return lastIntersection;
  }
  return __toCommonJS(entry_exports);
})();
