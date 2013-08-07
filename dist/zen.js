var zen = (function(){;//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

var _ = (function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };
  return _;
}).call({});
;/**
 * Core Emmet object, available in global scope
 */
var emmet = (function(global) {
	var defaultSyntax = 'html';
	var defaultProfile = 'plain';
	
	if (typeof _ == 'undefined') {
		try {
			// avoid collisions with RequireJS loader
			// also, JS obfuscators tends to translate
			// a["name"] to a.name, which also breaks RequireJS
			_ = global[['require'][0]]('underscore'); // node.js
		} catch (e) {}
	}

	if (typeof _ == 'undefined') {
		throw 'Cannot access to Underscore.js lib';
	}

	/** List of registered modules */
	var modules = {
		_ : _
	};
	
	/**
	 * Shared empty constructor function to aid in prototype-chain creation.
	 */
	var ctor = function(){};
	
	/**
	 * Helper function to correctly set up the prototype chain, for subclasses.
	 * Similar to `goog.inherits`, but uses a hash of prototype properties and
	 * class properties to be extended.
	 * Took it from Backbone.
	 * @param {Object} parent
	 * @param {Object} protoProps
	 * @param {Object} staticProps
	 * @returns {Object}
	 */
	function inherits(parent, protoProps, staticProps) {
		var child;

		// The constructor function for the new subclass is either defined by
		// you (the "constructor" property in your `extend` definition), or
		// defaulted by us to simply call the parent's constructor.
		if (protoProps && protoProps.hasOwnProperty('constructor')) {
			child = protoProps.constructor;
		} else {
			child = function() {
				parent.apply(this, arguments);
			};
		}

		// Inherit class (static) properties from parent.
		_.extend(child, parent);

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (protoProps)
			_.extend(child.prototype, protoProps);

		// Add static properties to the constructor function, if supplied.
		if (staticProps)
			_.extend(child, staticProps);

		// Correctly set child's `prototype.constructor`.
		child.prototype.constructor = child;

		// Set a convenience property in case the parent's prototype is needed
		// later.
		child.__super__ = parent.prototype;

		return child;
	};
	
	/**
	 * @type Function Function that loads module definition if it's not defined
	 */
	var moduleLoader = null;
	
	/**
	 * Generic Emmet module loader (actually, it doesn’t load anything, just 
	 * returns module reference). Not using `require` name to avoid conflicts
	 * with Node.js and RequireJS
	 */
	function r(name) {
		if (!(name in modules) && moduleLoader)
			moduleLoader(name);
		
		return modules[name];
	}
	
	return {
		/**
		 * Simple, AMD-like module definition. The module will be added into
		 * <code>emmet</code> object and will be available via
		 * <code>emmet.require(name)</code> or <code>emmet[name]</code>
		 * @param {String} name
		 * @param {Function} factory
		 * @memberOf emmet
		 */
		define: function(name, factory) {
			// do not let redefine existing properties
			if (!(name in modules)) {
				modules[name] = _.isFunction(factory) 
					? this.exec(factory)
					: factory;
			}
		},
		
		/**
		 * Returns reference to Emmet module
		 * @param {String} name Module name
		 */
		require: r,
		
		/**
		 * Helper method that just executes passed function but with all 
		 * important arguments like 'require' and '_'
		 * @param {Function} fn
		 * @param {Object} context Execution context
		 */
		exec: function(fn, context) {
			return fn.call(context || global, _.bind(r, this), _, this);
		},
		
		/**
		 * The self-propagating extend function for classes.
		 * Took it from Backbone 
		 * @param {Object} protoProps
		 * @param {Object} classProps
		 * @returns {Object}
		 */
		extend: function(protoProps, classProps) {
			var child = inherits(this, protoProps, classProps);
			child.extend = this.extend;
			// a hack required to WSH inherit `toString` method
			if (protoProps.hasOwnProperty('toString'))
				child.prototype.toString = protoProps.toString;
			return child;
		},
		
		/**
		 * The essential function that expands Emmet abbreviation
		 * @param {String} abbr Abbreviation to parse
		 * @param {String} syntax Abbreviation's context syntax
		 * @param {String} profile Output profile (or its name)
		 * @param {Object} contextNode Contextual node where abbreviation is
		 * written
		 * @return {String}
		 */
		expandAbbreviation: function(abbr, syntax, profile, contextNode) {
			if (!abbr) return '';
			
			syntax = syntax || defaultSyntax;
//			profile = profile || defaultProfile;
			
			var filters = r('filters');
			var parser = r('abbreviationParser');
			
			profile = r('profile').get(profile, syntax);
			r('tabStops').resetTabstopIndex();
			
			var data = filters.extractFromAbbreviation(abbr);
			var outputTree = parser.parse(data[0], {
				syntax: syntax, 
				contextNode: contextNode
			});
			
			var filtersList = filters.composeList(syntax, profile, data[1]);
			filters.apply(outputTree, filtersList, profile);
			return outputTree.toString();
		},
		
		/**
		 * Returns default syntax name used in abbreviation engine
		 * @returns {String}
		 */
		defaultSyntax: function() {
			return defaultSyntax;
		},
		
		/**
		 * Returns default profile name used in abbreviation engine
		 * @returns {String}
		 */
		defaultProfile: function() {
			return defaultProfile;
		},
		
		/**
		 * Log message into console if it exists
		 */
		log: function() {
			if (global.console && global.console.log)
				global.console.log.apply(global.console, arguments);
		},
		
		/**
		 * Setups function that should synchronously load undefined modules
		 * @param {Function} fn
		 */
		setModuleLoader: function(fn) {
			moduleLoader = fn;
		}
	};
})(this);

// export core for Node.JS
if (typeof exports !== 'undefined') {
	if (typeof module !== 'undefined' && module.exports) {
		exports = module.exports = emmet;
	}
	exports.emmet = emmet;
}

// export as Require.js module
if (typeof define !== 'undefined') {
	define(emmet);
};/**
 * Emmet abbreviation parser.
 * Takes string abbreviation and recursively parses it into a tree. The parsed 
 * tree can be transformed into a string representation with 
 * <code>toString()</code> method. Note that string representation is defined
 * by custom processors (called <i>filters</i>), not by abbreviation parser 
 * itself.
 * 
 * This module can be extended with custom pre-/post-processors to shape-up
 * final tree or its representation. Actually, many features of abbreviation 
 * engine are defined in other modules as tree processors
 * 
 * 
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @memberOf __abbreviationParser
 * @constructor
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('abbreviationParser', function(require, _) {
	var reValidName = /^[\w\-\$\:@\!%]+\+?$/i;
	var reWord = /[\w\-:\$@]/;
	
	var pairs = {
		'[': ']',
		'(': ')',
		'{': '}'
	};
	
	var spliceFn = Array.prototype.splice;
	
	var preprocessors = [];
	var postprocessors = [];
	var outputProcessors = [];
	
	/**
	 * @type AbbreviationNode
	 */
	function AbbreviationNode(parent) {
		/** @type AbbreviationNode */
		this.parent = null;
		this.children = [];
		this._attributes = [];
		
		/** @type String Raw abbreviation for current node */
		this.abbreviation = '';
		this.counter = 1;
		this._name = null;
		this._text = '';
		this.repeatCount = 1;
		this.hasImplicitRepeat = false;
		
		/** Custom data dictionary */
		this._data = {};
		
		// output properties
		this.start = '';
		this.end = '';
		this.content = '';
		this.padding = '';
	}
	
	AbbreviationNode.prototype = {
		/**
		 * Adds passed node as child or creates new child
		 * @param {AbbreviationNode} child
		 * @param {Number} position Index in children array where child should 
		 * be inserted
		 * @return {AbbreviationNode}
		 */
		addChild: function(child, position) {
			child = child || new AbbreviationNode;
			child.parent = this;
			
			if (_.isUndefined(position)) {
				this.children.push(child);
			} else {
				this.children.splice(position, 0, child);
			}
			
			return child;
		},
		
		/**
		 * Creates a deep copy of current node
		 * @returns {AbbreviationNode}
		 */
		clone: function() {
			var node = new AbbreviationNode();
			var attrs = ['abbreviation', 'counter', '_name', '_text', 'repeatCount', 'hasImplicitRepeat', 'start', 'end', 'content', 'padding'];
			_.each(attrs, function(a) {
				node[a] = this[a];
			}, this);
			
			// clone attributes
			node._attributes = _.map(this._attributes, function(attr) {
				return _.clone(attr);
			});
			
			node._data = _.clone(this._data);
			
			// clone children
			node.children = _.map(this.children, function(child) {
				child = child.clone();
				child.parent = node;
				return child;
			});
			
			return node;
		},
		
		/**
		 * Removes current node from parent‘s child list
		 * @returns {AbbreviationNode} Current node itself
		 */
		remove: function() {
			if (this.parent) {
				this.parent.children = _.without(this.parent.children, this);
			}
			
			return this;
		},
		
		/**
		 * Replaces current node in parent‘s children list with passed nodes
		 * @param {AbbreviationNode} node Replacement node or array of nodes
		 */
		replace: function() {
			var parent = this.parent;
			var ix = _.indexOf(parent.children, this);
			var items = _.flatten(arguments);
			spliceFn.apply(parent.children, [ix, 1].concat(items));
			
			// update parent
			_.each(items, function(item) {
				item.parent = parent;
			});
		},
		
		/**
		 * Recursively sets <code>property</code> to <code>value</code> of current
		 * node and its children 
		 * @param {String} name Property to update
		 * @param {Object} value New property value
		 */
		updateProperty: function(name, value) {
			this[name] = value;
			_.each(this.children, function(child) {
				child.updateProperty(name, value);
			});
			
			return this;
		},
		
		/**
		 * Finds first child node that matches truth test for passed 
		 * <code>fn</code> function
		 * @param {Function} fn
		 * @returns {AbbreviationNode}
		 */
		find: function(fn) {
			return this.findAll(fn)[0];
//			if (!_.isFunction(fn)) {
//				var elemName = fn.toLowerCase();
//				fn = function(item) {return item.name().toLowerCase() == elemName;};
//			}
//			
//			var result = null;
//			_.find(this.children, function(child) {
//				if (fn(child)) {
//					return result = child;
//				}
//				
//				return result = child.find(fn);
//			});
//			
//			return result;
		},
		
		/**
		 * Finds all child nodes that matches truth test for passed 
		 * <code>fn</code> function
		 * @param {Function} fn
		 * @returns {Array}
		 */
		findAll: function(fn) {
			if (!_.isFunction(fn)) {
				var elemName = fn.toLowerCase();
				fn = function(item) {return item.name().toLowerCase() == elemName;};
			}
				
			var result = [];
			_.each(this.children, function(child) {
				if (fn(child))
					result.push(child);
				
				result = result.concat(child.findAll(fn));
			});
			
			return _.compact(result);
		},
		
		/**
		 * Sets/gets custom data
		 * @param {String} name
		 * @param {Object} value
		 * @returns {Object}
		 */
		data: function(name, value) {
			if (arguments.length == 2) {
				this._data[name] = value;
				
				if (name == 'resource' && require('elements').is(value, 'snippet')) {
					// setting snippet as matched resource: update `content`
					// property with snippet value
					this.content = value.data;
					if (this._text) {
						this.content = require('abbreviationUtils')
							.insertChildContent(value.data, this._text);
					}
				}
			}
			
			return this._data[name];
		},
		
		/**
		 * Returns name of current node
		 * @returns {String}
		 */
		name: function() {
			var res = this.matchedResource();
			if (require('elements').is(res, 'element')) {
				return res.name;
			}
			
			return this._name;
		},
		
		/**
		 * Returns list of attributes for current node
		 * @returns {Array}
		 */
		attributeList: function() {
			var attrs = [];
			
			var res = this.matchedResource();
			if (require('elements').is(res, 'element') && _.isArray(res.attributes)) {
				attrs = attrs.concat(res.attributes);
			}
			
			return optimizeAttributes(attrs.concat(this._attributes));
		},
		
		/**
		 * Returns or sets attribute value
		 * @param {String} name Attribute name
		 * @param {String} value New attribute value
		 * @returns {String}
		 */
		attribute: function(name, value) {
			if (arguments.length == 2) {
				// modifying attribute
				var ix = _.indexOf(_.pluck(this._attributes, 'name'), name.toLowerCase());
				if (~ix) {
					this._attributes[ix].value = value;
				} else {
					this._attributes.push({
						name: name,
						value: value
					});
				}
			}
			
			return (_.find(this.attributeList(), function(attr) {
				return attr.name == name;
			}) || {}).value;
		},
		
		/**
		 * Returns reference to the matched <code>element</code>, if any.
		 * See {@link elements} module for a list of available elements
		 * @returns {Object}
		 */
		matchedResource: function() {
			return this.data('resource');
		},
		
		/**
		 * Returns index of current node in parent‘s children list
		 * @returns {Number}
		 */
		index: function() {
			return this.parent ? _.indexOf(this.parent.children, this) : -1;
		},
		
		/**
		 * Sets how many times current element should be repeated
		 * @private
		 */
		_setRepeat: function(count) {
			if (count) {
				this.repeatCount = parseInt(count, 10) || 1;
			} else {
				this.hasImplicitRepeat = true;
			}
		},
		
		/**
		 * Sets abbreviation that belongs to current node
		 * @param {String} abbr
		 */
		setAbbreviation: function(abbr) {
			abbr = abbr || '';
			
			var that = this;
			
			// find multiplier
			abbr = abbr.replace(/\*(\d+)?$/, function(str, repeatCount) {
				that._setRepeat(repeatCount);
				return '';
			});
			
			this.abbreviation = abbr;
			
			var abbrText = extractText(abbr);
			if (abbrText) {
				abbr = abbrText.element;
				this.content = this._text = abbrText.text;
			}
			
			var abbrAttrs = parseAttributes(abbr);
			if (abbrAttrs) {
				abbr = abbrAttrs.element;
				this._attributes = abbrAttrs.attributes;
			}
			
			this._name = abbr;
			
			// validate name
			if (this._name && !reValidName.test(this._name)) {
				throw 'Invalid abbreviation';
			}
		},
		
		/**
		 * Returns string representation of current node
		 * @return {String}
		 */
		toString: function() {
			var utils = require('utils');
			
			var start = this.start;
			var end = this.end;
			var content = this.content;
			
			// apply output processors
			var node = this;
			_.each(outputProcessors, function(fn) {
				start = fn(start, node, 'start');
				content = fn(content, node, 'content');
				end = fn(end, node, 'end');
			});
			
			
			var innerContent = _.map(this.children, function(child) {
				return child.toString();
			}).join('');
			
			content = require('abbreviationUtils').insertChildContent(content, innerContent, {
				keepVariable: false
			});
			
			return start + utils.padString(content, this.padding) + end;
		},
		
		/**
		 * Check if current node contains children with empty <code>expr</code>
		 * property
		 * @return {Boolean}
		 */
		hasEmptyChildren: function() {
			return !!_.find(this.children, function(child) {
				return child.isEmpty();
			});
		},
		
		/**
		 * Check if current node has implied name that should be resolved
		 * @returns {Boolean}
		 */
		hasImplicitName: function() {
			return !this._name && !this.isTextNode();
		},
		
		/**
		 * Indicates that current element is a grouping one, e.g. has no 
		 * representation but serves as a container for other nodes
		 * @returns {Boolean}
		 */
		isGroup: function() {
			return !this.abbreviation;
		},
		
		/**
		 * Indicates empty node (i.e. without abbreviation). It may be a 
		 * grouping node and should not be outputted
		 * @return {Boolean}
		 */
		isEmpty: function() {
			return !this.abbreviation && !this.children.length;
		},
		
		/**
		 * Indicates that current node should be repeated
		 * @returns {Boolean}
		 */
		isRepeating: function() {
			return this.repeatCount > 1 || this.hasImplicitRepeat;
		},
		
		/**
		 * Check if current node is a text-only node
		 * @return {Boolean}
		 */
		isTextNode: function() {
			return !this.name() && !this.attributeList().length;
		},
		
		/**
		 * Indicates whether this node may be used to build elements or snippets
		 * @returns {Boolean}
		 */
		isElement: function() {
			return !this.isEmpty() && !this.isTextNode();
		},
		
		/**
		 * Returns latest and deepest child of current tree
		 * @returns {AbbreviationNode}
		 */
		deepestChild: function() {
			if (!this.children.length)
				return null;
				
			var deepestChild = this;
			while (deepestChild.children.length) {
				deepestChild = _.last(deepestChild.children);
			}
			
			return deepestChild;
		}
	};
	
	/**
	 * Returns stripped string: a string without first and last character.
	 * Used for “unquoting” strings
	 * @param {String} str
	 * @returns {String}
	 */
	function stripped(str) {
		return str.substring(1, str.length - 1);
	}
	
	function consumeQuotedValue(stream, quote) {
		var ch;
		while (ch = stream.next()) {
			if (ch === quote)
				return true;
			
			if (ch == '\\')
				continue;
		}
		
		return false;
	}
	
	/**
	 * Parses abbreviation into a tree
	 * @param {String} abbr
	 * @returns {AbbreviationNode}
	 */
	function parseAbbreviation(abbr) {
		abbr = require('utils').trim(abbr);
		
		var root = new AbbreviationNode;
		var context = root.addChild(), ch;
		
		/** @type StringStream */
		var stream = require('stringStream').create(abbr);
		var loopProtector = 1000, multiplier;
		
		while (!stream.eol() && --loopProtector > 0) {
			ch = stream.peek();
			
			switch (ch) {
				case '(': // abbreviation group
					stream.start = stream.pos;
					if (stream.skipToPair('(', ')')) {
						var inner = parseAbbreviation(stripped(stream.current()));
						if (multiplier = stream.match(/^\*(\d+)?/, true)) {
							context._setRepeat(multiplier[1]);
						}
						
						_.each(inner.children, function(child) {
							context.addChild(child);
						});
					} else {
						throw 'Invalid abbreviation: mo matching ")" found for character at ' + stream.pos;
					}
					break;
					
				case '>': // child operator
					context = context.addChild();
					stream.next();
					break;
					
				case '+': // sibling operator
					context = context.parent.addChild();
					stream.next();
					break;
					
				case '^': // climb up operator
					var parent = context.parent || context;
					context = (parent.parent || parent).addChild();
					stream.next();
					break;
					
				default: // consume abbreviation
					stream.start = stream.pos;
					stream.eatWhile(function(c) {
						if (c == '[' || c == '{') {
							if (stream.skipToPair(c, pairs[c])) {
								stream.backUp(1);
								return true;
							}
							
							throw 'Invalid abbreviation: mo matching "' + pairs[c] + '" found for character at ' + stream.pos;
						}
						
						if (c == '+') {
							// let's see if this is an expando marker
							stream.next();
							var isMarker = stream.eol() ||  ~'+>^*'.indexOf(stream.peek());
							stream.backUp(1);
							return isMarker;
						}
						
						return c != '(' && isAllowedChar(c);
					});
					
					context.setAbbreviation(stream.current());
					stream.start = stream.pos;
			}
		}
		
		if (loopProtector < 1)
			throw 'Endless loop detected';
		
		return root;
	}
	
	/**
	 * Extract attributes and their values from attribute set: 
	 * <code>[attr col=3 title="Quoted string"]</code>
	 * @param {String} attrSet
	 * @returns {Array}
	 */
	function extractAttributes(attrSet, attrs) {
		attrSet = require('utils').trim(attrSet);
		var result = [];
		
		/** @type StringStream */
		var stream = require('stringStream').create(attrSet);
		stream.eatSpace();
		
		while (!stream.eol()) {
			stream.start = stream.pos;
			if (stream.eatWhile(reWord)) {
				var attrName = stream.current();
				var attrValue = '';
				if (stream.peek() == '=') {
					stream.next();
					stream.start = stream.pos;
					var quote = stream.peek();
					
					if (quote == '"' || quote == "'") {
						stream.next();
						if (consumeQuotedValue(stream, quote)) {
							attrValue = stream.current();
							// strip quotes
							attrValue = attrValue.substring(1, attrValue.length - 1);
						} else {
							throw 'Invalid attribute value';
						}
					} else if (stream.eatWhile(/[^\s\]]/)) {
						attrValue = stream.current();
					} else {
						throw 'Invalid attribute value';
					}
				}
				
				result.push({
					name: attrName, 
					value: attrValue
				});
				stream.eatSpace();
			} else {
				break;
			}
		}
		
		return result;
	}
	
	/**
	 * Parses tag attributes extracted from abbreviation. If attributes found, 
	 * returns object with <code>element</code> and <code>attributes</code>
	 * properties
	 * @param {String} abbr
	 * @returns {Object} Returns <code>null</code> if no attributes found in 
	 * abbreviation
	 */
	function parseAttributes(abbr) {
		/*
		 * Example of incoming data:
		 * #header
		 * .some.data
		 * .some.data#header
		 * [attr]
		 * #item[attr=Hello other="World"].class
		 */
		var result = [];
		var attrMap = {'#': 'id', '.': 'class'};
		var nameEnd = null;
		
		/** @type StringStream */
		var stream = require('stringStream').create(abbr);
		while (!stream.eol()) {
			switch (stream.peek()) {
				case '#': // id
				case '.': // class
					if (nameEnd === null)
						nameEnd = stream.pos;
					
					var attrName = attrMap[stream.peek()];
					
					stream.next();
					stream.start = stream.pos;
					stream.eatWhile(reWord);
					result.push({
						name: attrName, 
						value: stream.current()
					});
					break;
				case '[': //begin attribute set
					if (nameEnd === null)
						nameEnd = stream.pos;
					
					stream.start = stream.pos;
					if (!stream.skipToPair('[', ']')) 
						throw 'Invalid attribute set definition';
					
					result = result.concat(
						extractAttributes(stripped(stream.current()))
					);
					break;
				default:
					stream.next();
			}
		}
		
		if (!result.length)
			return null;
		
		return {
			element: abbr.substring(0, nameEnd),
			attributes: optimizeAttributes(result)
		};
	}
	
	/**
	 * Optimize attribute set: remove duplicates and merge class attributes
	 * @param attrs
	 */
	function optimizeAttributes(attrs) {
		// clone all attributes to make sure that original objects are 
		// not modified
		attrs  = _.map(attrs, function(attr) {
			return _.clone(attr);
		});
		
		var lookup = {};
		return _.filter(attrs, function(attr) {
			if (!(attr.name in lookup)) {
				return lookup[attr.name] = attr;
			}
			
			var la = lookup[attr.name];
			
			if (attr.name.toLowerCase() == 'class') {
				la.value += (la.value.length ? ' ' : '') + attr.value;
			} else {
				la.value = attr.value;
			}
			
			return false;
		});
	}
	
	/**
	 * Extract text data from abbreviation: if <code>a{hello}</code> abbreviation
	 * is passed, returns object <code>{element: 'a', text: 'hello'}</code>.
	 * If nothing found, returns <code>null</code>
	 * @param {String} abbr
	 * 
	 */
	function extractText(abbr) {
		if (!~abbr.indexOf('{'))
			return null;
		
		/** @type StringStream */
		var stream = require('stringStream').create(abbr);
		while (!stream.eol()) {
			switch (stream.peek()) {
				case '[':
				case '(':
					stream.skipToPair(stream.peek(), pairs[stream.peek()]); break;
					
				case '{':
					stream.start = stream.pos;
					stream.skipToPair('{', '}');
					return {
						element: abbr.substring(0, stream.start),
						text: stripped(stream.current())
					};
					
				default:
					stream.next();
			}
		}
	}
	
	/**
	 * “Un-rolls“ contents of current node: recursively replaces all repeating 
	 * children with their repeated clones
	 * @param {AbbreviationNode} node
	 * @returns {AbbreviationNode}
	 */
	function unroll(node) {
		for (var i = node.children.length - 1, j, child, maxCount; i >= 0; i--) {
			child = node.children[i];
			
			if (child.isRepeating()) {
				maxCount = j = child.repeatCount;
				child.repeatCount = 1;
				child.updateProperty('counter', 1);
				child.updateProperty('maxCount', maxCount);
				while (--j > 0) {
					child.parent.addChild(child.clone(), i + 1)
						.updateProperty('counter', j + 1)
						.updateProperty('maxCount', maxCount);
				}
			}
		}
		
		// to keep proper 'counter' property, we need to walk
		// on children once again
		_.each(node.children, unroll);
		
		return node;
	}
	
	/**
	 * Optimizes tree node: replaces empty nodes with their children
	 * @param {AbbreviationNode} node
	 * @return {AbbreviationNode}
	 */
	function squash(node) {
		for (var i = node.children.length - 1; i >= 0; i--) {
			/** @type AbbreviationNode */
			var n = node.children[i];
			if (n.isGroup()) {
				n.replace(squash(n).children);
			} else if (n.isEmpty()) {
				n.remove();
			}
		}
		
		_.each(node.children, squash);
		
		return node;
	}
	
	function isAllowedChar(ch) {
		var charCode = ch.charCodeAt(0);
		var specialChars = '#.*:$-_!@|%';
		
		return (charCode > 64 && charCode < 91)       // uppercase letter
				|| (charCode > 96 && charCode < 123)  // lowercase letter
				|| (charCode > 47 && charCode < 58)   // number
				|| specialChars.indexOf(ch) != -1;    // special character
	}
	
	// XXX add counter replacer function as output processor
	outputProcessors.push(function(text, node) {
		return require('utils').replaceCounter(text, node.counter, node.maxCount);
	});
	
	return {
		/**
		 * Parses abbreviation into tree with respect of groups, 
		 * text nodes and attributes. Each node of the tree is a single 
		 * abbreviation. Tree represents actual structure of the outputted 
		 * result
		 * @memberOf abbreviationParser
		 * @param {String} abbr Abbreviation to parse
		 * @param {Object} options Additional options for parser and processors
		 * 
		 * @return {AbbreviationNode}
		 */
		parse: function(abbr, options) {
			options = options || {};
			
			var tree = parseAbbreviation(abbr);
			
			if (options.contextNode) {
				// add info about context node –
				// a parent XHTML node in editor inside which abbreviation is 
				// expanded
				tree._name = options.contextNode.name;
				var attrLookup = {};
				_.each(tree._attributes, function(attr) {
					attrLookup[attr.name] = attr;
				});
				
				_.each(options.contextNode.attributes, function(attr) {
					if (attr.name in attrLookup) {
						attrLookup[attr.name].value = attr.value;
					} else {
						attr = _.clone(attr);
						tree._attributes.push(attr);
						attrLookup[attr.name] = attr;
					}
				});
			}
			
			
			// apply preprocessors
			_.each(preprocessors, function(fn) {
				fn(tree, options);
			});
			
			tree = squash(unroll(tree));
			
			// apply postprocessors
			_.each(postprocessors, function(fn) {
				fn(tree, options);
			});
			
			return tree;
		},
		
		AbbreviationNode: AbbreviationNode,
		
		/**
		 * Add new abbreviation preprocessor. <i>Preprocessor</i> is a function
		 * that applies to a parsed abbreviation tree right after it get parsed.
		 * The passed tree is in unoptimized state.
		 * @param {Function} fn Preprocessor function. This function receives
		 * two arguments: parsed abbreviation tree (<code>AbbreviationNode</code>)
		 * and <code>options</code> hash that was passed to <code>parse</code>
		 * method
		 */
		addPreprocessor: function(fn) {
			if (!_.include(preprocessors, fn))
				preprocessors.push(fn);
		},
		
		/**
		 * Removes registered preprocessor
		 */
		removeFilter: function(fn) {
			preprocessor = _.without(preprocessors, fn);
		},
		
		/**
		 * Adds new abbreviation postprocessor. <i>Postprocessor</i> is a 
		 * functinon that applies to <i>optimized</i> parsed abbreviation tree
		 * right before it returns from <code>parse()</code> method
		 * @param {Function} fn Postprocessor function. This function receives
		 * two arguments: parsed abbreviation tree (<code>AbbreviationNode</code>)
		 * and <code>options</code> hash that was passed to <code>parse</code>
		 * method
		 */
		addPostprocessor: function(fn) {
			if (!_.include(postprocessors, fn))
				postprocessors.push(fn);
		},
		
		/**
		 * Removes registered postprocessor function
		 */
		removePostprocessor: function(fn) {
			postprocessors = _.without(postprocessors, fn);
		},
		
		/**
		 * Registers output postprocessor. <i>Output processor</i> is a 
		 * function that applies to output part (<code>start</code>, 
		 * <code>end</code> and <code>content</code>) when 
		 * <code>AbbreviationNode.toString()</code> method is called
		 */
		addOutputProcessor: function(fn) {
			if (!_.include(outputProcessors, fn))
				outputProcessors.push(fn);
		},
		
		/**
		 * Removes registered output processor
		 */
		removeOutputProcessor: function(fn) {
			outputProcessors = _.without(outputProcessors, fn);
		},
		
		/**
		 * Check if passed symbol is valid symbol for abbreviation expression
		 * @param {String} ch
		 * @return {Boolean}
		 */
		isAllowedChar: function(ch) {
			ch = String(ch); // convert Java object to JS
			return isAllowedChar(ch) || ~'>+^[](){}'.indexOf(ch);
		}
	};
});;/**
 * Utility module for Emmet
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('utils', function(require, _) {
	/** 
	 * Special token used as a placeholder for caret positions inside 
	 * generated output 
	 */
	var caretPlaceholder = '${0}';
	
	/**
	 * A simple string builder, optimized for faster text concatenation
	 * @param {String} value Initial value
	 */
	function StringBuilder(value) {
		this._data = [];
		this.length = 0;
		
		if (value)
			this.append(value);
	}
	
	StringBuilder.prototype = {
		/**
		 * Append string
		 * @param {String} text
		 */
		append: function(text) {
			this._data.push(text);
			this.length += text.length;
		},
		
		/**
		 * @returns {String}
		 */
		toString: function() {
			return this._data.join('');
		},
		
		/**
		 * @returns {String}
		 */
		valueOf: function() {
			return this.toString();
		}
	};
	
	return {
		/** @memberOf utils */
		reTag: /<\/?[\w:\-]+(?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*\s*(\/?)>$/,
		
		/**
		 * Test if passed string ends with XHTML tag. This method is used for testing
		 * '>' character: it belongs to tag or it's a part of abbreviation? 
		 * @param {String} str
		 * @return {Boolean}
		 */
		endsWithTag: function(str) {
			return this.reTag.test(str);
		},
		
		/**
		 * Check if passed symbol is a number
		 * @param {String} ch
		 * @returns {Boolean}
		 */
		isNumeric: function(ch) {
			if (typeof(ch) == 'string')
				ch = ch.charCodeAt(0);
				
			return (ch && ch > 47 && ch < 58);
		},
		
		/**
		 * Trim whitespace from string
		 * @param {String} text
		 * @return {String}
		 */
		trim: function(text) {
			return (text || "").replace(/^\s+|\s+$/g, "");
		},
		
		/**
		 * Returns newline character
		 * @returns {String}
		 */
		getNewline: function() {
			var res = require('resources');
			if (!res) {
				return '\n';
			}
			
			var nl = res.getVariable('newline');
			return _.isString(nl) ? nl : '\n';
		},
		
		/**
		 * Sets new newline character that will be used in output
		 * @param {String} str
		 */
		setNewline: function(str) {
			var res = require('resources');
			res.setVariable('newline', str);
			res.setVariable('nl', str);
		},
		
		/**
		 * Split text into lines. Set <code>remove_empty</code> to true to filter
		 * empty lines
		 * @param {String} text Text to split
		 * @param {Boolean} removeEmpty Remove empty lines from result
		 * @return {Array}
		 */
		splitByLines: function(text, removeEmpty) {
			// IE fails to split string by regexp, 
			// need to normalize newlines first
			// Also, Mozilla's Rhiho JS engine has a weird newline bug
			var nl = this.getNewline();
			var lines = (text || '')
				.replace(/\r\n/g, '\n')
				.replace(/\n\r/g, '\n')
				.replace(/\r/g, '\n')
				.replace(/\n/g, nl)
				.split(nl);
			
			if (removeEmpty) {
				lines = _.filter(lines, function(line) {
					return line.length && !!this.trim(line);
				}, this);
			}
			
			return lines;
		},
		
		/**
		 * Normalizes newline character: replaces newlines in <code>text</code> 
		 * with newline defined in preferences
		 * @param {String} text
		 * @returns {String}
		 */
		normalizeNewline: function(text) {
			return this.splitByLines(text).join(this.getNewline());
		},
		
		/**
		 * Repeats string <code>howMany</code> times
		 * @param {String} str
		 * @param {Number} how_many
		 * @return {String}
		 */
		repeatString: function(str, howMany) {
			var result = [];
			
			for (var i = 0; i < howMany; i++) 
				result.push(str);
				
			return result.join('');
		},
		
		/**
		 * Returns list of paddings that should be used to align passed string
		 * @param {Array} strings
		 * @returns {Array}
		 */
		getStringsPads: function(strings) {
			var lengths = _.map(strings, function(s) {
				return _.isString(s) ? s.length : +s;
			});
			
			var max = _.max(lengths);
			return _.map(lengths, function(l) {
				var pad = max - l;
				return pad ? this.repeatString(' ', pad) : '';
			}, this);
		},
		
		/**
		 * Indents text with padding
		 * @param {String} text Text to indent
		 * @param {String} pad Padding size (number) or padding itself (string)
		 * @return {String}
		 */
		padString: function(text, pad) {
			var padStr = (_.isNumber(pad)) 
				? this.repeatString(require('resources').getVariable('indentation') || '\t', pad) 
				: pad;
				
			var result = [];
			
			var lines = this.splitByLines(text);
			var nl = this.getNewline();
				
			result.push(lines[0]);
			for (var j = 1; j < lines.length; j++) 
				result.push(nl + padStr + lines[j]);
				
			return result.join('');
		},
		
		/**
		 * Pad string with zeroes
		 * @param {String} str String to pad
		 * @param {Number} pad Desired string length
		 * @return {String}
		 */
		zeroPadString: function(str, pad) {
			var padding = '';
			var il = str.length;
				
			while (pad > il++) padding += '0';
			return padding + str; 
		},
		
		/**
		 * Removes padding at the beginning of each text's line
		 * @param {String} text
		 * @param {String} pad
		 */
		unindentString: function(text, pad) {
			var lines = this.splitByLines(text);
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].search(pad) == 0)
					lines[i] = lines[i].substr(pad.length);
			}
			
			return lines.join(this.getNewline());
		},
		
		/**
		 * Replaces unescaped symbols in <code>str</code>. For example, the '$' symbol
		 * will be replaced in 'item$count', but not in 'item\$count'.
		 * @param {String} str Original string
		 * @param {String} symbol Symbol to replace
		 * @param {String} replace Symbol replacement. Might be a function that 
		 * returns new value
		 * @return {String}
		 */
		replaceUnescapedSymbol: function(str, symbol, replace) {
			var i = 0;
			var il = str.length;
			var sl = symbol.length;
			var matchCount = 0;
				
			while (i < il) {
				if (str.charAt(i) == '\\') {
					// escaped symbol, skip next character
					i += sl + 1;
				} else if (str.substr(i, sl) == symbol) {
					// have match
					var curSl = sl;
					matchCount++;
					var newValue = replace;
					if (_.isFunction(replace)) {
						var replaceData = replace(str, symbol, i, matchCount);
						if (replaceData) {
							curSl = replaceData[0].length;
							newValue = replaceData[1];
						} else {
							newValue = false;
						}
					}
					
					if (newValue === false) { // skip replacement
						i++;
						continue;
					}
					
					str = str.substring(0, i) + newValue + str.substring(i + curSl);
					// adjust indexes
					il = str.length;
					i += newValue.length;
				} else {
					i++;
				}
			}
			
			return str;
		},
		
		/**
		 * Replace variables like ${var} in string
		 * @param {String} str
		 * @param {Object} vars Variable set (defaults to variables defined in 
		 * <code>snippets.json</code>) or variable resolver (<code>Function</code>)
		 * @return {String}
		 */
		replaceVariables: function(str, vars) {
			vars = vars || {};
			var resolver = _.isFunction(vars) ? vars : function(str, p1) {
				return p1 in vars ? vars[p1] : null;
			};
			
			var res = require('resources');
			return require('tabStops').processText(str, {
				variable: function(data) {
					var newValue = resolver(data.token, data.name, data);
					if (newValue === null) {
						// try to find variable in resources
						newValue = res.getVariable(data.name);
					}
					
					if (newValue === null || _.isUndefined(newValue))
						// nothing found, return token itself
						newValue = data.token;
					return newValue;
				}
			});
		},
		
		/**
		 * Replaces '$' character in string assuming it might be escaped with '\'
		 * @param {String} str String where character should be replaced
		 * @param {String} value New value
		 * @return {String}
		 */
		replaceCounter: function(str, value, total) {
			var symbol = '$';
			// in case we received strings from Java, convert the to native strings
			str = String(str);
			value = String(value);
			
			if (/^\-?\d+$/.test(value)) {
				value = +value;
			}
			
			var that = this;
			
			return this.replaceUnescapedSymbol(str, symbol, function(str, symbol, pos, matchNum){
				if (str.charAt(pos + 1) == '{' || that.isNumeric(str.charAt(pos + 1)) ) {
					// it's a variable, skip it
					return false;
				}
				
				// replace sequense of $ symbols with padded number  
				var j = pos + 1;
				while(str.charAt(j) == '$' && str.charAt(j + 1) != '{') j++;
				var pad = j - pos;
				
				// get counter base
				var base = 0, decrement = false, m;
				if (m = str.substr(j).match(/^@(\-?)(\d*)/)) {
					j += m[0].length;
					
					if (m[1]) {
						decrement = true;
					}
					
					base = parseInt(m[2] || 1) - 1;
				}
				
				if (decrement && total && _.isNumber(value)) {
					value = total - value + 1;
				}
				
				value += base;
				
				return [str.substring(pos, j), that.zeroPadString(value + '', pad)];
			});
		},
		
		/**
		 * Check if string matches against <code>reTag</code> regexp. This 
		 * function may be used to test if provided string contains HTML tags
		 * @param {String} str
		 * @returns {Boolean}
		 */
		matchesTag: function(str) {
			return this.reTag.test(str || '');
		},
		
		/**
		 * Escapes special characters used in Emmet, like '$', '|', etc.
		 * Use this method before passing to actions like "Wrap with Abbreviation"
		 * to make sure that existing special characters won't be altered
		 * @param {String} text
		 * @return {String}
		 */
		escapeText: function(text) {
			return text.replace(/([\$\\])/g, '\\$1');
		},
		
		/**
		 * Unescapes special characters used in Emmet, like '$', '|', etc.
		 * @param {String} text
		 * @return {String}
		 */
		unescapeText: function(text) {
			return text.replace(/\\(.)/g, '$1');
		},
		
		/**
		 * Returns caret placeholder
		 * @returns {String}
		 */
		getCaretPlaceholder: function() {
			return _.isFunction(caretPlaceholder) 
				? caretPlaceholder.apply(this, arguments)
				: caretPlaceholder;
		},
		
		/**
		 * Sets new representation for carets in generated output
		 * @param {String} value New caret placeholder. Might be a 
		 * <code>Function</code>
		 */
		setCaretPlaceholder: function(value) {
			caretPlaceholder = value;
		},
		
		/**
		 * Returns line padding
		 * @param {String} line
		 * @return {String}
		 */
		getLinePadding: function(line) {
			return (line.match(/^(\s+)/) || [''])[0];
		},
		
		/**
		 * Helper function that returns padding of line of <code>pos</code>
		 * position in <code>content</code>
		 * @param {String} content
		 * @param {Number} pos
		 * @returns {String}
		 */
		getLinePaddingFromPosition: function(content, pos) {
			var lineRange = this.findNewlineBounds(content, pos);
			return this.getLinePadding(lineRange.substring(content));
		},
		
		/**
		 * Escape special regexp chars in string, making it usable for creating dynamic
		 * regular expressions
		 * @param {String} str
		 * @return {String}
		 */
		escapeForRegexp: function(str) {
			var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
			return str.replace(specials, "\\$&");
		},
		
		/**
		 * Make decimal number look good: convert it to fixed precision end remove
		 * traling zeroes 
		 * @param {Number} num
		 * @param {Number} fracion Fraction numbers (default is 2)
		 * @return {String}
		 */
		prettifyNumber: function(num, fraction) {
			return num.toFixed(typeof fraction == 'undefined' ? 2 : fraction).replace(/\.?0+$/, '');
		},
		
		/**
		 * A simple mutable string shim, optimized for faster text concatenation
		 * @param {String} value Initial value
		 * @returns {StringBuilder}
		 */
		stringBuilder: function(value) {
			return new StringBuilder(value);
		},
		
		/**
		 * Replace substring of <code>str</code> with <code>value</code>
		 * @param {String} str String where to replace substring
		 * @param {String} value New substring value
		 * @param {Number} start Start index of substring to replace. May also
		 * be a <code>Range</code> object: in this case, the <code>end</code>
		 * argument is not required
		 * @param {Number} end End index of substring to replace. If ommited, 
		 * <code>start</code> argument is used
		 */
		replaceSubstring: function(str, value, start, end) {
			if (_.isObject(start) && 'end' in start) {
				end = start.end;
				start = start.start;
			}
			
			if (_.isString(end))
				end = start + end.length;
			
			if (_.isUndefined(end))
				end = start;
			
			if (start < 0 || start > str.length)
				return str;
			
			return str.substring(0, start) + value + str.substring(end);
		},
		
		/**
		 * Narrows down text range, adjusting selection to non-space characters
		 * @param {String} text
		 * @param {Number} start Starting range in <code>text</code> where 
		 * slection should be adjusted. Can also be any object that is accepted
		 * by <code>Range</code> class
		 * @return {Range}
		 */
		narrowToNonSpace: function(text, start, end) {
			var range = require('range').create(start, end);
			
			var reSpace = /[\s\n\r\u00a0]/;
			// narrow down selection until first non-space character
			while (range.start < range.end) {
				if (!reSpace.test(text.charAt(range.start)))
					break;
					
				range.start++;
			}
			
			while (range.end > range.start) {
				range.end--;
				if (!reSpace.test(text.charAt(range.end))) {
					range.end++;
					break;
				}
			}
			
			return range;
		},
		
		/**
		 * Find start and end index of text line for <code>from</code> index
		 * @param {String} text 
		 * @param {Number} from
		 */
		findNewlineBounds: function(text, from) {
			var len = text.length,
				start = 0,
				end = len - 1;
			
			// search left
			for (var i = from - 1; i > 0; i--) {
				var ch = text.charAt(i);
				if (ch == '\n' || ch == '\r') {
					start = i + 1;
					break;
				}
			}
			// search right
			for (var j = from; j < len; j++) {
				var ch = text.charAt(j);
				if (ch == '\n' || ch == '\r') {
					end = j;
					break;
				}
			}
			
			return require('range').create(start, end - start);
		},

		/**
		 * Deep merge of two or more objects. Taken from jQuery.extend()
		 */
		deepMerge: function() {
			var options, name, src, copy, copyIsArray, clone,
				target = arguments[0] || {},
				i = 1,
				length = arguments.length;


			// Handle case when target is a string or something (possible in deep copy)
			if (!_.isObject(target) && !_.isFunction(target)) {
				target = {};
			}

			for ( ; i < length; i++ ) {
				// Only deal with non-null/undefined values
				if ( (options = arguments[ i ]) != null ) {
					// Extend the base object
					for ( name in options ) {
						src = target[ name ];
						copy = options[ name ];

						// Prevent never-ending loop
						if ( target === copy ) {
							continue;
						}

						// Recurse if we're merging plain objects or arrays
						if ( copy && ( _.isObject(copy) || (copyIsArray = _.isArray(copy)) ) ) {
							if ( copyIsArray ) {
								copyIsArray = false;
								clone = src && _.isArray(src) ? src : [];

							} else {
								clone = src && _.isObject(src) ? src : {};
							}

							// Never move original objects, clone them
							target[ name ] = this.deepMerge(clone, copy );

						// Don't bring in undefined values
						} else if ( copy !== undefined ) {
							target[ name ] = copy;
						}
					}
				}
			}

			// Return the modified object
			return target;
		}
	};
});
;/**
 * Utility module that provides ordered storage of function handlers. 
 * Many Emmet modules' functionality can be extended/overridden by custom
 * function. This modules provides unified storage of handler functions, their 
 * management and execution
 * 
 * @constructor
 * @memberOf __handlerListDefine
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('handlerList', function(require, _) {
	/**
	 * @type HandlerList
	 * @constructor
	 */
	function HandlerList() {
		this._list = [];
	}
	
	HandlerList.prototype = {
		/**
		 * Adds function handler
		 * @param {Function} fn Handler
		 * @param {Object} options Handler options. Possible values are:<br><br>
		 * <b>order</b> : (<code>Number</code>) – order in handler list. Handlers
		 * with higher order value will be executed earlier.
		 */
		add: function(fn, options) {
			this._list.push(_.extend({order: 0}, options || {}, {fn: fn}));
		},
		
		/**
		 * Removes handler from list
		 * @param {Function} fn
		 */
		remove: function(fn) {
			this._list = _.without(this._list, _.find(this._list, function(item) {
				return item.fn === fn;
			}));
		},
		
		/**
		 * Returns ordered list of handlers. By default, handlers 
		 * with the same <code>order</code> option returned in reverse order, 
		 * i.e. the latter function was added into the handlers list, the higher 
		 * it will be in the returned array 
		 * @returns {Array}
		 */
		list: function() {
			return _.sortBy(this._list, 'order').reverse();
		},
		
		/**
		 * Returns ordered list of handler functions
		 * @returns {Array}
		 */
		listFn: function() {
			return _.pluck(this.list(), 'fn');
		},
		
		/**
		 * Executes handler functions in their designated order. If function
		 * returns <code>skipVal</code>, meaning that function was unable to 
		 * handle passed <code>args</code>, the next function will be executed
		 * and so on.
		 * @param {Object} skipValue If function returns this value, execute 
		 * next handler.
		 * @param {Array} args Arguments to pass to handler function
		 * @returns {Boolean} Whether any of registered handlers performed
		 * successfully  
		 */
		exec: function(skipValue, args) {
			args = args || [];
			var result = null;
			_.find(this.list(), function(h) {
				result = h.fn.apply(h, args);
				if (result !== skipValue)
					return true;
			});
			
			return result;
		}
	};
	
	return {
		/**
		 * Factory method that produces <code>HandlerList</code> instance
		 * @returns {HandlerList}
		 * @memberOf handlerList
		 */
		create: function() {
			return new HandlerList();
		}
	};
});;/**
 * A trimmed version of CodeMirror's StringStream module for string parsing
 */
emmet.define('stringStream', function(require, _) {
	/**
	 * @type StringStream
	 * @constructor
	 * @param {String} string
	 */
	function StringStream(string) {
		this.pos = this.start = 0;
		this.string = string;
	}
	
	StringStream.prototype = {
		/**
		 * Returns true only if the stream is at the end of the line.
		 * @returns {Boolean}
		 */
		eol: function() {
			return this.pos >= this.string.length;
		},
		
		/**
		 * Returns true only if the stream is at the start of the line
		 * @returns {Boolean}
		 */
		sol: function() {
			return this.pos == 0;
		},
		
		/**
		 * Returns the next character in the stream without advancing it. 
		 * Will return <code>undefined</code> at the end of the line.
		 * @returns {String}
		 */
		peek: function() {
			return this.string.charAt(this.pos);
		},
		
		/**
		 * Returns the next character in the stream and advances it.
		 * Also returns <code>undefined</code> when no more characters are available.
		 * @returns {String}
		 */
		next: function() {
			if (this.pos < this.string.length)
				return this.string.charAt(this.pos++);
		},
		
		/**
		 * match can be a character, a regular expression, or a function that
		 * takes a character and returns a boolean. If the next character in the
		 * stream 'matches' the given argument, it is consumed and returned.
		 * Otherwise, undefined is returned.
		 * @param {Object} match
		 * @returns {String}
		 */
		eat: function(match) {
			var ch = this.string.charAt(this.pos), ok;
			if (typeof match == "string")
				ok = ch == match;
			else
				ok = ch && (match.test ? match.test(ch) : match(ch));
			
			if (ok) {
				++this.pos;
				return ch;
			}
		},
		
		/**
		 * Repeatedly calls <code>eat</code> with the given argument, until it
		 * fails. Returns <code>true</code> if any characters were eaten.
		 * @param {Object} match
		 * @returns {Boolean}
		 */
		eatWhile: function(match) {
			var start = this.pos;
			while (this.eat(match)) {}
			return this.pos > start;
		},
		
		/**
		 * Shortcut for <code>eatWhile</code> when matching white-space.
		 * @returns {Boolean}
		 */
		eatSpace: function() {
			var start = this.pos;
			while (/[\s\u00a0]/.test(this.string.charAt(this.pos)))
				++this.pos;
			return this.pos > start;
		},
		
		/**
		 * Moves the position to the end of the line.
		 */
		skipToEnd: function() {
			this.pos = this.string.length;
		},
		
		/**
		 * Skips to the next occurrence of the given character, if found on the
		 * current line (doesn't advance the stream if the character does not
		 * occur on the line). Returns true if the character was found.
		 * @param {String} ch
		 * @returns {Boolean}
		 */
		skipTo: function(ch) {
			var found = this.string.indexOf(ch, this.pos);
			if (found > -1) {
				this.pos = found;
				return true;
			}
		},
		
		/**
		 * Skips to <code>close</code> character which is pair to <code>open</code>
		 * character, considering possible pair nesting. This function is used
		 * to consume pair of characters, like opening and closing braces
		 * @param {String} open
		 * @param {String} close
		 * @returns {Boolean} Returns <code>true</code> if pair was successfully
		 * consumed
		 */
		skipToPair: function(open, close) {
			var braceCount = 0, ch;
			var pos = this.pos, len = this.string.length;
			while (pos < len) {
				ch = this.string.charAt(pos++);
				if (ch == open) {
					braceCount++;
				} else if (ch == close) {
					braceCount--;
					if (braceCount < 1) {
						this.pos = pos;
						return true;
					}
				}
			}
			
			return false;
		},
		
		/**
		 * Backs up the stream n characters. Backing it up further than the
		 * start of the current token will cause things to break, so be careful.
		 * @param {Number} n
		 */
		backUp : function(n) {
			this.pos -= n;
		},
		
		/**
		 * Act like a multi-character <code>eat</code>—if <code>consume</code> is true or
		 * not given—or a look-ahead that doesn't update the stream position—if
		 * it is false. <code>pattern</code> can be either a string or a
		 * regular expression starting with ^. When it is a string,
		 * <code>caseInsensitive</code> can be set to true to make the match
		 * case-insensitive. When successfully matching a regular expression,
		 * the returned value will be the array returned by <code>match</code>,
		 * in case you need to extract matched groups.
		 * 
		 * @param {RegExp} pattern
		 * @param {Boolean} consume
		 * @param {Boolean} caseInsensitive
		 * @returns
		 */
		match: function(pattern, consume, caseInsensitive) {
			if (typeof pattern == "string") {
				var cased = caseInsensitive
					? function(str) {return str.toLowerCase();}
					: function(str) {return str;};
				
				if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
					if (consume !== false)
						this.pos += pattern.length;
					return true;
				}
			} else {
				var match = this.string.slice(this.pos).match(pattern);
				if (match && consume !== false)
					this.pos += match[0].length;
				return match;
			}
		},
		
		/**
		 * Get the string between the start of the current token and the 
		 * current stream position.
		 * @returns {String}
		 */
		current: function() {
			return this.string.slice(this.start, this.pos);
		}
	};
	
	return {
		create: function(string) {
			return new StringStream(string);
		}
	};
});;/**
 * Parsed resources (snippets, abbreviations, variables, etc.) for Emmet.
 * Contains convenient method to get access for snippets with respect of 
 * inheritance. Also provides ability to store data in different vocabularies
 * ('system' and 'user') for fast and safe resource update
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('resources', function(require, _) {
	var VOC_SYSTEM = 'system';
	var VOC_USER = 'user';
	
	var cache = {};
		
	/** Regular expression for XML tag matching */
	var reTag = /^<(\w+\:?[\w\-]*)((?:\s+[\w\:\-]+\s*=\s*(['"]).*?\3)*)\s*(\/?)>/;
		
	var systemSettings = {};
	var userSettings = {};
	
	/** @type HandlerList List of registered abbreviation resolvers */
	var resolvers = require('handlerList').create();
	
	/**
	 * Normalizes caret plceholder in passed text: replaces | character with
	 * default caret placeholder
	 * @param {String} text
	 * @returns {String}
	 */
	function normalizeCaretPlaceholder(text) {
		var utils = require('utils');
		return utils.replaceUnescapedSymbol(text, '|', utils.getCaretPlaceholder());
	}
	
	function parseItem(name, value, type) {
		value = normalizeCaretPlaceholder(value);
		
		if (type == 'snippets') {
			return require('elements').create('snippet', value);
		}
		
		if (type == 'abbreviations') {
			return parseAbbreviation(name, value);
		}
	}
	
	/**
	 * Parses single abbreviation
	 * @param {String} key Abbreviation name
	 * @param {String} value Abbreviation value
	 * @return {Object}
	 */
	function parseAbbreviation(key, value) {
		key = require('utils').trim(key);
		var elements = require('elements');
		var m;
		if (m = reTag.exec(value)) {
			return elements.create('element', m[1], m[2], m[4] == '/');
		} else {
			// assume it's reference to another abbreviation
			return elements.create('reference', value);
		}
	}
	
	/**
	 * Normalizes snippet key name for better fuzzy search
	 * @param {String} str
	 * @returns {String}
	 */
	function normalizeName(str) {
		return str.replace(/:$/, '').replace(/:/g, '-');
	}
	
	return {
		/**
		 * Sets new unparsed data for specified settings vocabulary
		 * @param {Object} data
		 * @param {String} type Vocabulary type ('system' or 'user')
		 * @memberOf resources
		 */
		setVocabulary: function(data, type) {
			cache = {};
			if (type == VOC_SYSTEM)
				systemSettings = data;
			else
				userSettings = data;
		},
		
		/**
		 * Returns resource vocabulary by its name
		 * @param {String} name Vocabulary name ('system' or 'user')
		 * @return {Object}
		 */
		getVocabulary: function(name) {
			return name == VOC_SYSTEM ? systemSettings : userSettings;
		},
		
		/**
		 * Returns resource (abbreviation, snippet, etc.) matched for passed 
		 * abbreviation
		 * @param {TreeNode} node
		 * @param {String} syntax
		 * @returns {Object}
		 */
		getMatchedResource: function(node, syntax) {
			return resolvers.exec(null, _.toArray(arguments)) 
				|| this.findSnippet(syntax, node.name());
		},
		
		/**
		 * Returns variable value
		 * @return {String}
		 */
		getVariable: function(name) {
			return (this.getSection('variables') || {})[name];
		},
		
		/**
		 * Store runtime variable in user storage
		 * @param {String} name Variable name
		 * @param {String} value Variable value
		 */
		setVariable: function(name, value){
			var voc = this.getVocabulary('user') || {};
			if (!('variables' in voc))
				voc.variables = {};
				
			voc.variables[name] = value;
			this.setVocabulary(voc, 'user');
		},
		
		/**
		 * Check if there are resources for specified syntax
		 * @param {String} syntax
		 * @return {Boolean}
		 */
		hasSyntax: function(syntax) {
			return syntax in this.getVocabulary(VOC_USER) 
				|| syntax in this.getVocabulary(VOC_SYSTEM);
		},
		
		/**
		 * Registers new abbreviation resolver.
		 * @param {Function} fn Abbreviation resolver which will receive 
		 * abbreviation as first argument and should return parsed abbreviation
		 * object if abbreviation has handled successfully, <code>null</code>
		 * otherwise
		 * @param {Object} options Options list as described in 
		 * {@link HandlerList#add()} method
		 */
		addResolver: function(fn, options) {
			resolvers.add(fn, options);
		},
		
		removeResolver: function(fn) {
			resolvers.remove(fn);
		},
		
		/**
		 * Returns actual section data, merged from both
		 * system and user data
		 * @param {String} name Section name (syntax)
		 * @param {String} ...args Subsections
		 * @returns
		 */
		getSection: function(name) {
			if (!name)
				return null;
			
			if (!(name in cache)) {
				cache[name] = require('utils').deepMerge({}, systemSettings[name], userSettings[name]);
			}
			
			var data = cache[name], subsections = _.rest(arguments), key;
			while (data && (key = subsections.shift())) {
				if (key in data) {
					data = data[key];
				} else {
					return null;
				}
			}
			
			return data;
		},
		
		/**
		 * Recursively searches for a item inside top level sections (syntaxes)
		 * with respect of `extends` attribute
		 * @param {String} topSection Top section name (syntax)
		 * @param {String} subsection Inner section name
		 * @returns {Object}
		 */
		findItem: function(topSection, subsection) {
			var data = this.getSection(topSection);
			while (data) {
				if (subsection in data)
					return data[subsection];
				
				data = this.getSection(data['extends']);
			}
		},
		
		/**
		 * Recursively searches for a snippet definition inside syntax section.
		 * Definition is searched inside `snippets` and `abbreviations` 
		 * subsections  
		 * @param {String} syntax Top-level section name (syntax)
		 * @param {String} name Snippet name
		 * @returns {Object}
		 */
		findSnippet: function(syntax, name, memo) {
			if (!syntax || !name)
				return null;
			
			memo = memo || [];
			
			var names = [name];
			// create automatic aliases to properties with colons,
			// e.g. pos-a == pos:a
			if (~name.indexOf('-'))
				names.push(name.replace(/\-/g, ':'));
			
			var data = this.getSection(syntax), matchedItem = null;
			_.find(['snippets', 'abbreviations'], function(sectionName) {
				var data = this.getSection(syntax, sectionName);
				if (data) {
					return _.find(names, function(n) {
						if (data[n])
							return matchedItem = parseItem(n, data[n], sectionName);
					});
				}
			}, this);
			
			memo.push(syntax);
			if (!matchedItem && data['extends'] && !_.include(memo, data['extends'])) {
				// try to find item in parent syntax section
				return this.findSnippet(data['extends'], name, memo);
			}
			
			return matchedItem;
		},
		
		/**
		 * Performs fuzzy search of snippet definition
		 * @param {String} syntax Top-level section name (syntax)
		 * @param {String} name Snippet name
		 * @returns
		 */
		fuzzyFindSnippet: function(syntax, name, minScore) {
			minScore = minScore || 0.3;
			
			var payload = this.getAllSnippets(syntax);
			var sc = require('string-score');
			
			name = normalizeName(name);
			var scores = _.map(payload, function(value, key) {
				return {
					key: key,
					score: sc.score(value.nk, name, 0.1)
				};
			});
			
			var result = _.last(_.sortBy(scores, 'score'));
			if (result && result.score >= minScore) {
				var k = result.key;
				return payload[k].parsedValue;
//				return parseItem(k, payload[k].value, payload[k].type);
			}
		},
		
		/**
		 * Returns plain dictionary of all available abbreviations and snippets
		 * for specified syntax with respect of inheritance
		 * @param {String} syntax
		 * @returns {Object}
		 */
		getAllSnippets: function(syntax) {
			var cacheKey = 'all-' + syntax;
			if (!cache[cacheKey]) {
				var stack = [], sectionKey = syntax;
				var memo = [];
				
				do {
					var section = this.getSection(sectionKey);
					if (!section)
						break;
					
					_.each(['snippets', 'abbreviations'], function(sectionName) {
						var stackItem = {};
						_.each(section[sectionName] || null, function(v, k) {
							stackItem[k] = {
								nk: normalizeName(k),
								value: v,
								parsedValue: parseItem(k, v, sectionName),
								type: sectionName
							};
						});
						
						stack.push(stackItem);
					});
					
					memo.push(sectionKey);
					sectionKey = section['extends'];
				} while (sectionKey && !_.include(memo, sectionKey));
				
				
				cache[cacheKey] = _.extend.apply(_, stack.reverse());
			}
			
			return cache[cacheKey];
		}
	};
});;/**
 * Output profile module.
 * Profile defines how XHTML output data should look like
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('profile', function(require, _) {
	var profiles = {};
	
	var defaultProfile = {
		tag_case: 'asis',
		attr_case: 'asis',
		attr_quotes: 'double',
		
		// each tag on new line
		tag_nl: 'decide',
		
		// with tag_nl === true, defines if leaf node (e.g. node with no children)
		// should have formatted line breaks
		tag_nl_leaf: false,
		
		place_cursor: true,
		
		// indent tags
		indent: true,
		
		// how many inline elements should be to force line break 
		// (set to 0 to disable)
		inline_break: 3,
		
		// use self-closing style for writing empty elements, e.g. <br /> or <br>
		self_closing_tag: 'xhtml',
		
		// Profile-level output filters, re-defines syntax filters 
		filters: '',
		
		// Additional filters applied to abbreviation.
		// Unlike "filters", this preference doesn't override default filters
		// but add the instead every time given profile is chosen
		extraFilters: ''
	};
	
	/**
	 * @constructor
	 * @type OutputProfile
	 * @param {Object} options
	 */
	function OutputProfile(options) {
		_.extend(this, defaultProfile, options);
	}
	
	OutputProfile.prototype = {
		/**
		 * Transforms tag name case depending on current profile settings
		 * @param {String} name String to transform
		 * @returns {String}
		 */
		tagName: function(name) {
			return stringCase(name, this.tag_case);
		},
		
		/**
		 * Transforms attribute name case depending on current profile settings 
		 * @param {String} name String to transform
		 * @returns {String}
		 */
		attributeName: function(name) {
			return stringCase(name, this.attr_case);
		},
		
		/**
		 * Returns quote character for current profile
		 * @returns {String}
		 */
		attributeQuote: function() {
			return this.attr_quotes == 'single' ? "'" : '"';
		},
		
		/**
		 * Returns self-closing tag symbol for current profile
		 * @param {String} param
		 * @returns {String}
		 */
		selfClosing: function(param) {
			if (this.self_closing_tag == 'xhtml')
				return ' /';
			
			if (this.self_closing_tag === true)
				return '/';
			
			return '';
		},
		
		/**
		 * Returns cursor token based on current profile settings
		 * @returns {String}
		 */
		cursor: function() {
			return this.place_cursor ? require('utils').getCaretPlaceholder() : '';
		}
	};
	
	/**
	 * Helper function that converts string case depending on 
	 * <code>caseValue</code> 
	 * @param {String} str String to transform
	 * @param {String} caseValue Case value: can be <i>lower</i>, 
	 * <i>upper</i> and <i>leave</i>
	 * @returns {String}
	 */
	function stringCase(str, caseValue) {
		switch (String(caseValue || '').toLowerCase()) {
			case 'lower':
				return str.toLowerCase();
			case 'upper':
				return str.toUpperCase();
		}
		
		return str;
	}
	
	/**
	 * Creates new output profile
	 * @param {String} name Profile name
	 * @param {Object} options Profile options
	 */
	function createProfile(name, options) {
		return profiles[name.toLowerCase()] = new OutputProfile(options);
	}
	
	function createDefaultProfiles() {
		createProfile('xhtml');
		createProfile('html', {self_closing_tag: false});
		createProfile('xml', {self_closing_tag: true, tag_nl: true});
		createProfile('plain', {tag_nl: false, indent: false, place_cursor: false});
		createProfile('line', {tag_nl: false, indent: false, extraFilters: 's'});
	}
	
	createDefaultProfiles();
	
	return  {
		/**
		 * Creates new output profile and adds it into internal dictionary
		 * @param {String} name Profile name
		 * @param {Object} options Profile options
		 * @memberOf emmet.profile
		 * @returns {Object} New profile
		 */
		create: function(name, options) {
			if (arguments.length == 2)
				return createProfile(name, options);
			else
				// create profile object only
				return new OutputProfile(_.defaults(name || {}, defaultProfile));
		},
		
		/**
		 * Returns profile by its name. If profile wasn't found, returns
		 * 'plain' profile
		 * @param {String} name Profile name. Might be profile itself
		 * @param {String} syntax. Optional. Current editor syntax. If defined,
		 * profile is searched in resources first, then in predefined profiles
		 * @returns {Object}
		 */
		get: function(name, syntax) {
			if (!name && syntax) {
				// search in user resources first
				var profile = require('resources').findItem(syntax, 'profile');
				if (profile) {
					name = profile;
				}
			}
			
			if (!name) {
				return profiles.plain;
			}
			
			if (name instanceof OutputProfile) {
				return name;
			}
			
			if (_.isString(name) && name.toLowerCase() in profiles) {
				return profiles[name.toLowerCase()];
			}
			
			return this.create(name);
		},
		
		/**
		 * Deletes profile with specified name
		 * @param {String} name Profile name
		 */
		remove: function(name) {
			name = (name || '').toLowerCase();
			if (name in profiles)
				delete profiles[name];
		},
		
		/**
		 * Resets all user-defined profiles
		 */
		reset: function() {
			profiles = {};
			createDefaultProfiles();
		},
		
		/**
		 * Helper function that converts string case depending on 
		 * <code>caseValue</code> 
		 * @param {String} str String to transform
		 * @param {String} caseValue Case value: can be <i>lower</i>, 
		 * <i>upper</i> and <i>leave</i>
		 * @returns {String}
		 */
		stringCase: stringCase
	};
});;/**
 * Utility functions to work with <code>AbbreviationNode</code> as HTML element
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('abbreviationUtils', function(require, _) {
	return {
		/**
		 * Check if passed abbreviation node has matched snippet resource
		 * @param {AbbreviationNode} node
		 * @returns {Boolean}
		 * @memberOf abbreviationUtils
		 */
		isSnippet: function(node) {
			return require('elements').is(node.matchedResource(), 'snippet');
		},
		
		/**
		 * Test if passed node is unary (no closing tag)
		 * @param {AbbreviationNode} node
		 * @return {Boolean}
		 */
		isUnary: function(node) {
			if (node.children.length || node._text || this.isSnippet(node)) {
				return false;
			}
			
			var r = node.matchedResource();
			return r && r.is_empty;
		},
		
		/**
		 * Test if passed node is inline-level (like &lt;strong&gt;, &lt;img&gt;)
		 * @param {AbbreviationNode} node
		 * @return {Boolean}
		 */
		isInline: function(node) {
			return node.isTextNode() 
				|| !node.name() 
				|| require('tagName').isInlineLevel(node.name());
		},
		
		/**
		 * Test if passed node is block-level
		 * @param {AbbreviationNode} node
		 * @return {Boolean}
		 */
		isBlock: function(node) {
			return this.isSnippet(node) || !this.isInline(node);
		},
		
		/**
		 * Test if given node is a snippet
		 * @param {AbbreviationNode} node
		 * @return {Boolean}
		 */
		isSnippet: function(node) {
			return require('elements').is(node.matchedResource(), 'snippet');
		},
		
		/**
		 * This function tests if passed node content contains HTML tags. 
		 * This function is mostly used for output formatting
		 * @param {AbbreviationNode} node
		 * @returns {Boolean}
		 */
		hasTagsInContent: function(node) {
			return require('utils').matchesTag(node.content);
		},
		
		/**
		 * Test if current element contains block-level children
		 * @param {AbbreviationNode} node
		 * @return {Boolean}
		 */
		hasBlockChildren: function(node) {
			return (this.hasTagsInContent(node) && this.isBlock(node)) 
				|| _.any(node.children, function(child) {
					return this.isBlock(child);
				}, this);
		},
		
		/**
		 * Utility function that inserts content instead of <code>${child}</code>
		 * variables on <code>text</code>
		 * @param {String} text Text where child content should be inserted
		 * @param {String} childContent Content to insert
		 * @param {Object} options
		 * @returns {String
		 */
		insertChildContent: function(text, childContent, options) {
			options = _.extend({
				keepVariable: true,
				appendIfNoChild: true
			}, options || {});
			
			var childVariableReplaced = false;
			var utils = require('utils');
			text = utils.replaceVariables(text, function(variable, name, data) {
				var output = variable;
				if (name == 'child') {
					// add correct indentation
					output = utils.padString(childContent, utils.getLinePaddingFromPosition(text, data.start));
					childVariableReplaced = true;
					if (options.keepVariable)
						output += variable;
				}
				
				return output;
			});
			
			if (!childVariableReplaced && options.appendIfNoChild) {
				text += childContent;
			}
			
			return text;
		}
	};
});;/**
 * HTML matcher: takes string and searches for HTML tag pairs for given position 
 * 
 * Unlike “classic” matchers, it parses content from the specified 
 * position, not from the start, so it may work even outside HTML documents
 * (for example, inside strings of programming languages like JavaScript, Python 
 * etc.)
 * @constructor
 * @memberOf __htmlMatcherDefine
 */
emmet.define('htmlMatcher', function(require, _) {
	// Regular Expressions for parsing tags and attributes
	var reOpenTag = /^<([\w\:\-]+)((?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
	var reCloseTag = /^<\/([\w\:\-]+)[^>]*>/;
	
	function openTag(i, match) {
		return {
			name: match[1],
			selfClose: !!match[3],
			/** @type Range */
			range: require('range').create(i, match[0]),
			type: 'open'
		};
	}
	
	function closeTag(i, match) {
		return {
			name: match[1],
			/** @type Range */
			range: require('range').create(i, match[0]),
			type: 'close'
		};
	}
	
	function comment(i, match) {
		return {
			/** @type Range */
			range: require('range').create(i, _.isNumber(match) ? match - i : match[0]),
			type: 'comment'
		};
	}
	
	/**
	 * Creates new tag matcher session
	 * @param {String} text
	 */
	function createMatcher(text) {
		var memo = {}, m;
		return {
			/**
			 * Test if given position matches opening tag
			 * @param {Number} i
			 * @returns {Object} Matched tag object
			 */
			open: function(i) {
				var m = this.matches(i);
				return m && m.type == 'open' ? m : null;
			},
			
			/**
			 * Test if given position matches closing tag
			 * @param {Number} i
			 * @returns {Object} Matched tag object
			 */
			close: function(i) {
				var m = this.matches(i);
				return m && m.type == 'close' ? m : null;
			},
			
			/**
			 * Matches either opening or closing tag for given position
			 * @param i
			 * @returns
			 */
			matches: function(i) {
				var key = 'p' + i;
				
				if (!(key in memo)) {
					if (text.charAt(i) == '<') {
						var substr = text.slice(i);
						if (m = substr.match(reOpenTag)) {
							memo[key] = openTag(i, m);
						} else if (m = substr.match(reCloseTag)) {
							memo[key] = closeTag(i, m);
						} else {
							// remember that given position contains no valid tag
							memo[key] = false;
						}
					}
				}
				
				return memo[key];
			},
			
			/**
			 * Returns original text
			 * @returns {String}
			 */
			text: function() {
				return text;
			}
		};
	}
	
	function matches(text, pos, pattern) {
		return text.substring(pos, pos + pattern.length) == pattern;
	}
	
	/**
	 * Search for closing pair of opening tag
	 * @param {Object} open Open tag instance
	 * @param {Object} matcher Matcher instance
	 */
	function findClosingPair(open, matcher) {
		var stack = [], tag = null;
		var text = matcher.text();
		
		for (var pos = open.range.end, len = text.length; pos < len; pos++) {
			if (matches(text, pos, '<!--')) {
				// skip to end of comment
				for (var j = pos; j < len; j++) {
					if (matches(text, j, '-->')) {
						pos = j + 3;
						break;
					}
				}
			}
			
			if (tag = matcher.matches(pos)) {
				if (tag.type == 'open' && !tag.selfClose) {
					stack.push(tag.name);
				} else if (tag.type == 'close') {
					if (!stack.length) { // found valid pair?
						return tag.name == open.name ? tag : null;
					}
					
					// check if current closing tag matches previously opened one
					if (_.last(stack) == tag.name) {
						stack.pop();
					} else {
						var found = false;
						while (stack.length && !found) {
							var last = stack.pop();
							if (last == tag.name) {
								found = true;
							}
						}
						
						if (!stack.length && !found) {
							return tag.name == open.name ? tag : null;
						}
					}
				}
			}
			
		}
	}
	
	return {
		/**
		 * Main function: search for tag pair in <code>text</code> for given 
		 * position
		 * @memberOf htmlMatcher
		 * @param {String} text 
		 * @param {Number} pos
		 * @returns {Object}
		 */
		find: function(text, pos) {
			var range = require('range');
			var matcher = createMatcher(text); 
			var open = null, close = null;
			
			for (var i = pos; i >= 0; i--) {
				if (open = matcher.open(i)) {
					// found opening tag
					if (open.selfClose) {
						if (open.range.cmp(pos, 'lt', 'gt')) {
							// inside self-closing tag, found match
							break;
						}
						
						// outside self-closing tag, continue
						continue;
					}
					
					close = findClosingPair(open, matcher);
					if (close) {
						// found closing tag.
						var r = range.create2(open.range.start, close.range.end);
						if (r.contains(pos)) {
							break;
						}
					} else if (open.range.contains(pos)) {
						// we inside empty HTML tag like <br>
						break;
					}
					
					open = null;
				} else if (matches(text, i, '-->')) {
					// skip back to comment start
					for (var j = i - 1; j >= 0; j--) {
						if (matches(text, j, '-->')) {
							// found another comment end, do nothing
							break;
						} else if (matches(text, j, '<!--')) {
							i = j;
							break;
						}
					}
				} else if (matches(text, i, '<!--')) {
					// we're inside comment, match it
					var j = i + 4, jl = text.length;
					for (; j < jl; j++) {
						if (matches(text, j, '-->')) {
							j += 3;
							break;
						}
					}
					
					open = comment(i, j);
					break;
				}
			}
			
			if (open) {
				var outerRange = null;
				var innerRange = null;
				
				if (close) {
					outerRange = range.create2(open.range.start, close.range.end);
					innerRange = range.create2(open.range.end, close.range.start);
				} else {
					outerRange = innerRange = range.create2(open.range.start, open.range.end);
				}
				
				if (open.type == 'comment') {
					// adjust positions of inner range for comment
					var _c = outerRange.substring(text);
					innerRange.start += _c.length - _c.replace(/^<\!--\s*/, '').length;
					innerRange.end -= _c.length - _c.replace(/\s*-->$/, '').length;
				}
				
				return {
					open: open,
					close: close,
					type: open.type == 'comment' ? 'comment' : 'tag',
					innerRange: innerRange,
					innerContent: function() {
						return this.innerRange.substring(text);
					},
					outerRange: outerRange,
					outerContent: function() {
						return this.outerRange.substring(text);
					},
					range: !innerRange.length() || !innerRange.cmp(pos, 'lte', 'gte') ? outerRange : innerRange,
					content: function() {
						return this.range.substring(text);
					},
					source: text
				};
			}
		},
		
		/**
		 * The same as <code>find()</code> method, but restricts matched result 
		 * to <code>tag</code> type
		 * @param {String} text 
		 * @param {Number} pos
		 * @returns {Object}
		 */
		tag: function(text, pos) {
			var result = this.find(text, pos);
			if (result && result.type == 'tag') {
				return result;
			}
		}
	};
});;/**
 * Utility module for handling tabstops tokens generated by Emmet's 
 * "Expand Abbreviation" action. The main <code>extract</code> method will take
 * raw text (for example: <i>${0} some ${1:text}</i>), find all tabstops 
 * occurrences, replace them with tokens suitable for your editor of choice and 
 * return object with processed text and list of found tabstops and their ranges.
 * For sake of portability (Objective-C/Java) the tabstops list is a plain 
 * sorted array with plain objects.
 * 
 * Placeholders with the same are meant to be <i>linked</i> in your editor.
 * @param {Function} require
 * @param {Underscore} _  
 */
emmet.define('tabStops', function(require, _) {
	/**
	 * Global placeholder value, automatically incremented by 
	 * <code>variablesResolver()</code> function
	 */
	var startPlaceholderNum = 100;
	
	var tabstopIndex = 0;
	
	var defaultOptions = {
		replaceCarets: false,
		escape: function(ch) {
			return '\\' + ch;
		},
		tabstop: function(data) {
			return data.token;
		},
		variable: function(data) {
			return data.token;
		}
	};
	
	// XXX register output processor that will upgrade tabstops of parsed node
	// in order to prevent tabstop index conflicts
	require('abbreviationParser').addOutputProcessor(function(text, node, type) {
		var maxNum = 0;
		var tabstops = require('tabStops');
		var utils = require('utils');
		
		var tsOptions = {
			tabstop: function(data) {
				var group = parseInt(data.group);
				if (group == 0)
					return '${0}';
				
				if (group > maxNum) maxNum = group;
				if (data.placeholder) {
					// respect nested placeholders
					var ix = group + tabstopIndex;
					var placeholder = tabstops.processText(data.placeholder, tsOptions);
					return '${' + ix + ':' + placeholder + '}';
				} else {
					return '${' + (group + tabstopIndex) + '}';
				}
			}
		};
		
		// upgrade tabstops
		text = tabstops.processText(text, tsOptions);
		
		// resolve variables
		text = utils.replaceVariables(text, tabstops.variablesResolver(node));
		
		tabstopIndex += maxNum + 1;
		return text;
	});
	
	return {
		/**
		 * Main function that looks for a tabstops in provided <code>text</code>
		 * and returns a processed version of <code>text</code> with expanded 
		 * placeholders and list of tabstops found.
		 * @param {String} text Text to process
		 * @param {Object} options List of processor options:<br>
		 * 
		 * <b>replaceCarets</b> : <code>Boolean</code> — replace all default
		 * caret placeholders (like <i>{%::emmet-caret::%}</i>) with <i>${0:caret}</i><br>
		 * 
		 * <b>escape</b> : <code>Function</code> — function that handle escaped
		 * characters (mostly '$'). By default, it returns the character itself 
		 * to be displayed as is in output, but sometimes you will use 
		 * <code>extract</code> method as intermediate solution for further 
		 * processing and want to keep character escaped. Thus, you should override
		 * <code>escape</code> method to return escaped symbol (e.g. '\\$')<br>
		 * 
		 * <b>tabstop</b> : <code>Function</code> – a tabstop handler. Receives 
		 * a single argument – an object describing token: its position, number 
		 * group, placeholder and token itself. Should return a replacement 
		 * string that will appear in final output
		 * 
		 * <b>variable</b> : <code>Function</code> – variable handler. Receives 
		 * a single argument – an object describing token: its position, name 
		 * and original token itself. Should return a replacement 
		 * string that will appear in final output
		 * 
		 * @returns {Object} Object with processed <code>text</code> property
		 * and array of <code>tabstops</code> found
		 * @memberOf tabStops
		 */
		extract: function(text, options) {
			// prepare defaults
			var utils = require('utils');
			var placeholders = {carets: ''};
			var marks = [];
			
			options = _.extend({}, defaultOptions, options, {
				tabstop: function(data) {
					var token = data.token;
					var ret = '';
					if (data.placeholder == 'cursor') {
						marks.push({
							start: data.start,
							end: data.start + token.length,
							group: 'carets',
							value: ''
						});
					} else {
						// unify placeholder value for single group
						if ('placeholder' in data)
							placeholders[data.group] = data.placeholder;
						
						if (data.group in placeholders)
							ret = placeholders[data.group];
						
						marks.push({
							start: data.start,
							end: data.start + token.length,
							group: data.group,
							value: ret
						});
					}
					
					return token;
				}
			});
			
			if (options.replaceCarets) {
				text = text.replace(new RegExp( utils.escapeForRegexp( utils.getCaretPlaceholder() ), 'g'), '${0:cursor}');
			}
			
			// locate tabstops and unify group's placeholders
			text = this.processText(text, options);
			
			// now, replace all tabstops with placeholders
			var buf = utils.stringBuilder(), lastIx = 0;
			var tabStops = _.map(marks, function(mark) {
				buf.append(text.substring(lastIx, mark.start));
				
				var pos = buf.length;
				var ph = placeholders[mark.group] || '';
				
				buf.append(ph);
				lastIx = mark.end;
				
				return {
					group: mark.group,
					start: pos,
					end:  pos + ph.length
				};
			});
			
			buf.append(text.substring(lastIx));
			
			return {
				text: buf.toString(),
				tabstops: _.sortBy(tabStops, 'start')
			};
		},
		
		/**
		 * Text processing routine. Locates escaped characters and tabstops and
		 * replaces them with values returned by handlers defined in 
		 * <code>options</code>
		 * @param {String} text
		 * @param {Object} options See <code>extract</code> method options 
		 * description
		 * @returns {String}
		 */
		processText: function(text, options) {
			options = _.extend({}, defaultOptions, options);
			
			var buf = require('utils').stringBuilder();
			/** @type StringStream */
			var stream = require('stringStream').create(text);
			var ch, m, a;
			
			while (ch = stream.next()) {
				if (ch == '\\' && !stream.eol()) {
					// handle escaped character
					buf.append(options.escape(stream.next()));
					continue;
				}
				
				a = ch;
				
				if (ch == '$') {
					// looks like a tabstop
					stream.start = stream.pos - 1;
					
					if (m = stream.match(/^[0-9]+/)) {
						// it's $N
						a = options.tabstop({
							start: buf.length, 
							group: stream.current().substr(1),
							token: stream.current()
						});
					} else if (m = stream.match(/^\{([a-z_\-][\w\-]*)\}/)) {
						// ${variable}
						a = options.variable({
							start: buf.length, 
							name: m[1],
							token: stream.current()
						});
					} else if (m = stream.match(/^\{([0-9]+)(:.+?)?\}/, false)) {
						// ${N:value} or ${N} placeholder
						// parse placeholder, including nested ones
						stream.skipToPair('{', '}');
						
						var obj = {
							start: buf.length, 
							group: m[1],
							token: stream.current()
						};
						
						var placeholder = obj.token.substring(obj.group.length + 2, obj.token.length - 1);
						
						if (placeholder) {
							obj.placeholder = placeholder.substr(1);
						}
						
						a = options.tabstop(obj);
					}
				}
				
				buf.append(a);
			}
			
			return buf.toString();
		},
		
		/**
		 * Upgrades tabstops in output node in order to prevent naming conflicts
		 * @param {AbbreviationNode} node
		 * @param {Number} offset Tab index offset
		 * @returns {Number} Maximum tabstop index in element
		 */
		upgrade: function(node, offset) {
			var maxNum = 0;
			var options = {
				tabstop: function(data) {
					var group = parseInt(data.group);
					if (group > maxNum) maxNum = group;
						
					if (data.placeholder)
						return '${' + (group + offset) + ':' + data.placeholder + '}';
					else
						return '${' + (group + offset) + '}';
				}
			};
			
			_.each(['start', 'end', 'content'], function(p) {
				node[p] = this.processText(node[p], options);
			}, this);
			
			return maxNum;
		},
		
		/**
		 * Helper function that produces a callback function for 
		 * <code>replaceVariables()</code> method from {@link utils}
		 * module. This callback will replace variable definitions (like 
		 * ${var_name}) with their value defined in <i>resource</i> module,
		 * or outputs tabstop with variable name otherwise.
		 * @param {AbbreviationNode} node Context node
		 * @returns {Function}
		 */
		variablesResolver: function(node) {
			var placeholderMemo = {};
			var res = require('resources');
			return function(str, varName) {
				// do not mark `child` variable as placeholder – it‘s a reserved
				// variable name
				if (varName == 'child')
					return str;
				
				if (varName == 'cursor')
					return require('utils').getCaretPlaceholder();
				
				var attr = node.attribute(varName);
				if (!_.isUndefined(attr) && attr !== str) {
					return attr;
				}
				
				var varValue = res.getVariable(varName);
				if (varValue)
					return varValue;
				
				// output as placeholder
				if (!placeholderMemo[varName])
					placeholderMemo[varName] = startPlaceholderNum++;
					
				return '${' + placeholderMemo[varName] + ':' + varName + '}';
			};
		},
		
		/**
		 * Resets global tabstop index. When parsed tree is converted to output
		 * string (<code>AbbreviationNode.toString()</code>), all tabstops 
		 * defined in snippets and elements are upgraded in order to prevent
		 * naming conflicts of nested. For example, <code>${1}</code> of a node
		 * should not be linked with the same placehilder of the child node.
		 * By default, <code>AbbreviationNode.toString()</code> automatically
		 * upgrades tabstops of the same index for each node and writes maximum
		 * tabstop index into the <code>tabstopIndex</code> variable. To keep
		 * this variable at reasonable value, it is recommended to call 
		 * <code>resetTabstopIndex()</code> method each time you expand variable 
		 * @returns
		 */
		resetTabstopIndex: function() {
			tabstopIndex = 0;
			startPlaceholderNum = 100;
		}
	};
});;/**
 * Common module's preferences storage. This module 
 * provides general storage for all module preferences, their description and
 * default values.<br><br>
 * 
 * This module can also be used to list all available properties to create 
 * UI for updating properties
 * 
 * @memberOf __preferencesDefine
 * @constructor
 * @param {Function} require
 * @param {Underscore} _ 
 */
emmet.define('preferences', function(require, _) {
	var preferences = {};
	var defaults = {};
	var _dbgDefaults = null;
	var _dbgPreferences = null;

	function toBoolean(val) {
		if (_.isString(val)) {
			val = val.toLowerCase();
			return val == 'yes' || val == 'true' || val == '1';
		}

		return !!val;
	}
	
	function isValueObj(obj) {
		return _.isObject(obj) 
			&& 'value' in obj 
			&& _.keys(obj).length < 3;
	}
	
	return {
		/**
		 * Creates new preference item with default value
		 * @param {String} name Preference name. You can also pass object
		 * with many options
		 * @param {Object} value Preference default value
		 * @param {String} description Item textual description
		 * @memberOf preferences
		 */
		define: function(name, value, description) {
			var prefs = name;
			if (_.isString(name)) {
				prefs = {};
				prefs[name] = {
					value: value,
					description: description
				};
			}
			
			_.each(prefs, function(v, k) {
				defaults[k] = isValueObj(v) ? v : {value: v};
			});
		},
		
		/**
		 * Updates preference item value. Preference value should be defined
		 * first with <code>define</code> method.
		 * @param {String} name Preference name. You can also pass object
		 * with many options
		 * @param {Object} value Preference default value
		 * @memberOf preferences
		 */
		set: function(name, value) {
			var prefs = name;
			if (_.isString(name)) {
				prefs = {};
				prefs[name] = value;
			}
			
			_.each(prefs, function(v, k) {
				if (!(k in defaults)) {
					throw 'Property "' + k + '" is not defined. You should define it first with `define` method of current module';
				}
				
				// do not set value if it equals to default value
				if (v !== defaults[k].value) {
					// make sure we have value of correct type
					switch (typeof defaults[k].value) {
						case 'boolean':
							v = toBoolean(v);
							break;
						case 'number':
							v = parseInt(v + '', 10) || 0;
							break;
						default: // convert to string
							v += '';
					}

					preferences[k] = v;
				} else if  (k in preferences) {
					delete preferences[k];
				}
			});
		},
		
		/**
		 * Returns preference value
		 * @param {String} name
		 * @returns {String} Returns <code>undefined</code> if preference is 
		 * not defined
		 */
		get: function(name) {
			if (name in preferences)
				return preferences[name];
			
			if (name in defaults)
				return defaults[name].value;
			
			return void 0;
		},
		
		/**
		 * Returns comma-separated preference value as array of values
		 * @param {String} name
		 * @returns {Array} Returns <code>undefined</code> if preference is 
		 * not defined, <code>null</code> if string cannot be converted to array
		 */
		getArray: function(name) {
			var val = this.get(name);
			if (!_.isUndefined(val)) {
				val = _.map(val.split(','), require('utils').trim);
				if (!val.length)
					val = null;
			}
			
			return val;
		},
		
		/**
		 * Returns comma and colon-separated preference value as dictionary
		 * @param {String} name
		 * @returns {Object}
		 */
		getDict: function(name) {
			var result = {};
			_.each(this.getArray(name), function(val) {
				var parts = val.split(':');
				result[parts[0]] = parts[1];
			});
			
			return result;
		},
		
		/**
		 * Returns description of preference item
		 * @param {String} name Preference name
		 * @returns {Object}
		 */
		description: function(name) {
			return name in defaults ? defaults[name].description : void 0;
		},
		
		/**
		 * Completely removes specified preference(s)
		 * @param {String} name Preference name (or array of names)
		 */
		remove: function(name) {
			if (!_.isArray(name))
				name = [name];
			
			_.each(name, function(key) {
				if (key in preferences)
					delete preferences[key];
				
				if (key in defaults)
					delete defaults[key];
			});
		},
		
		/**
		 * Returns sorted list of all available properties
		 * @returns {Array}
		 */
		list: function() {
			return _.map(_.keys(defaults).sort(), function(key) {
				return {
					name: key,
					value: this.get(key),
					type: typeof defaults[key].value,
					description: defaults[key].description
				};
			}, this);
		},
		
		/**
		 * Loads user-defined preferences from JSON
		 * @param {Object} json
		 * @returns
		 */
		load: function(json) {
			_.each(json, function(value, key) {
				this.set(key, value);
			}, this);
		},

		/**
		 * Returns hash of user-modified preferences
		 * @returns {Object}
		 */
		exportModified: function() {
			return _.clone(preferences);
		},
		
		/**
		 * Reset to defaults
		 * @returns
		 */
		reset: function() {
			preferences = {};
		},
		
		/**
		 * For unit testing: use empty storage
		 */
		_startTest: function() {
			_dbgDefaults = defaults;
			_dbgPreferences = preferences;
			defaults = {};
			preferences = {};
		},
		
		/**
		 * For unit testing: restore original storage
		 */
		_stopTest: function() {
			defaults = _dbgDefaults;
			preferences = _dbgPreferences;
		}
	};
});;/**
 * Module that contains factories for element types used by Emmet
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('elements', function(require, _) {
	var factories = {};
	var reAttrs = /([\w\-]+)\s*=\s*(['"])(.*?)\2/g;
	
	var result = {
		/**
		 * Create new element factory
		 * @param {String} name Element identifier
		 * @param {Function} factory Function that produces element of specified 
		 * type. The object generated by this factory is automatically 
		 * augmented with <code>type</code> property pointing to element
		 * <code>name</code>
		 * @memberOf elements
		 */
		add: function(name, factory) {
			var that = this;
			factories[name] = function() {
				var elem = factory.apply(that, arguments);
				if (elem)
					elem.type = name;
				
				return elem;
			};
		},
		
		/**
		 * Returns factory for specified name
		 * @param {String} name
		 * @returns {Function}
		 */
		get: function(name) {
			return factories[name];
		},
		
		/**
		 * Creates new element with specified type
		 * @param {String} name
		 * @returns {Object}
		 */
		create: function(name) {
			var args = [].slice.call(arguments, 1);
			var factory = this.get(name);
			return factory ? factory.apply(this, args) : null;
		},
		
		/**
		 * Check if passed element is of specified type
		 * @param {Object} elem
		 * @param {String} type
		 * @returns {Boolean}
		 */
		is: function(elem, type) {
			return elem && elem.type === type;
		}
	};
	
	// register resource references
	function commonFactory(value) {
		return {data: value};
	}
	
	/**
	 * Element factory
	 * @param {String} elementName Name of output element
	 * @param {String} attrs Attributes definition. You may also pass
	 * <code>Array</code> where each contains object with <code>name</code> 
	 * and <code>value</code> properties, or <code>Object</code>
	 * @param {Boolean} isEmpty Is expanded element should be empty
	 */
	result.add('element', function(elementName, attrs, isEmpty) {
		var ret = {
			/** @memberOf __emmetDataElement */
			name: elementName,
			is_empty: !!isEmpty
		};
		
		if (attrs) {
			ret.attributes = [];
			if (_.isArray(attrs)) {
				ret.attributes = attrs;
			} else if (_.isString(attrs)) {
				var m;
				while (m = reAttrs.exec(attrs)) {
					ret.attributes.push({
						name: m[1],
						value: m[3]
					});
				}
			} else {
				_.each(attrs, function(value, name) {
					ret.attributes.push({
						name: name, 
						value: value
					});
				});
			}
		}
		
		return ret;
	});
	
	result.add('snippet', commonFactory);
	result.add('reference', commonFactory);
	result.add('empty', function() {
		return {};
	});
	
	return result;
});;/**
 * Module for handling filters
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com) <http://chikuyonok.ru>
 */
emmet.define('filters', function(require, _) {
	/** List of registered filters */
	var registeredFilters = {};
	
	/** Filters that will be applied for unknown syntax */
	var basicFilters = 'html';
	
	function list(filters) {
		if (!filters)
			return [];
		
		if (_.isString(filters))
			return filters.split(/[\|,]/g);
		
		return filters;
	}
	
	return  {
		/**
		 * Register new filter
		 * @param {String} name Filter name
		 * @param {Function} fn Filter function
		 */
		add: function(name, fn) {
			registeredFilters[name] = fn;
		},
		
		/**
		 * Apply filters for final output tree
		 * @param {AbbreviationNode} tree Output tree
		 * @param {Array} filters List of filters to apply. Might be a 
		 * <code>String</code>
		 * @param {Object} profile Output profile, defined in <i>profile</i> 
		 * module. Filters defined it profile are not used, <code>profile</code>
		 * is passed to filter function
		 * @memberOf emmet.filters
		 * @returns {AbbreviationNode}
		 */
		apply: function(tree, filters, profile) {
			var utils = require('utils');
			profile = require('profile').get(profile);
			
			_.each(list(filters), function(filter) {
				var name = utils.trim(filter.toLowerCase());
				if (name && name in registeredFilters) {
					tree = registeredFilters[name](tree, profile);
				}
			});
			
			return tree;
		},
		
		/**
		 * Composes list of filters that should be applied to a tree, based on 
		 * passed data
		 * @param {String} syntax Syntax name ('html', 'css', etc.)
		 * @param {Object} profile Output profile
		 * @param {String} additionalFilters List or pipe-separated
		 * string of additional filters to apply
		 * @returns {Array}
		 */
		composeList: function(syntax, profile, additionalFilters) {
			profile = require('profile').get(profile);
			var filters = list(profile.filters || require('resources').findItem(syntax, 'filters') || basicFilters);
			
			if (profile.extraFilters) {
				filters = filters.concat(list(profile.extraFilters));
			}
				
			if (additionalFilters) {
				filters = filters.concat(list(additionalFilters));
			}
				
			if (!filters || !filters.length) {
				// looks like unknown syntax, apply basic filters
				filters = list(basicFilters);
			}
				
			return filters;
		},
		
		/**
		 * Extracts filter list from abbreviation
		 * @param {String} abbr
		 * @returns {Array} Array with cleaned abbreviation and list of 
		 * extracted filters
		 */
		extractFromAbbreviation: function(abbr) {
			var filters = '';
			abbr = abbr.replace(/\|([\w\|\-]+)$/, function(str, p1){
				filters = p1;
				return '';
			});
			
			return [abbr, list(filters)];
		}
	};
});;/**
 * Generic formatting filter: creates proper indentation for each tree node,
 * placing "%s" placeholder where the actual output should be. You can use
 * this filter to preformat tree and then replace %s placeholder to whatever you
 * need. This filter should't be called directly from editor as a part 
 * of abbreviation.
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @constructor
 * @memberOf __formatFilterDefine
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.exec(function(require, _){
	var placeholder = '%s';
	
	/** @type preferences */
	var prefs = require('preferences');
	prefs.define('format.noIndentTags', 'html', 
			'A comma-separated list of tag names that should not get inner indentation.');
	
	prefs.define('format.forceIndentationForTags', 'body', 
		'A comma-separated list of tag names that should <em>always</em> get inner indentation.');
	
	/**
	 * Get indentation for given node
	 * @param {AbbreviationNode} node
	 * @returns {String}
	 */
	function getIndentation(node) {
		if (_.include(prefs.getArray('format.noIndentTags') || [], node.name())) {
			return '';
		}
		
		return require('resources').getVariable('indentation');
	}
	
	/**
	 * Test if passed node has block-level sibling element
	 * @param {AbbreviationNode} item
	 * @return {Boolean}
	 */
	function hasBlockSibling(item) {
		return item.parent && require('abbreviationUtils').hasBlockChildren(item.parent);
	}
	
	/**
	 * Test if passed item is very first child in parsed tree
	 * @param {AbbreviationNode} item
	 */
	function isVeryFirstChild(item) {
		return item.parent && !item.parent.parent && !item.index();
	}
	
	/**
	 * Check if a newline should be added before element
	 * @param {AbbreviationNode} node
	 * @param {OutputProfile} profile
	 * @return {Boolean}
	 */
	function shouldAddLineBreak(node, profile) {
		var abbrUtils = require('abbreviationUtils');
		if (profile.tag_nl === true || abbrUtils.isBlock(node))
			return true;
		
		if (!node.parent || !profile.inline_break)
			return false;
		
		// check if there are required amount of adjacent inline element
		return shouldFormatInline(node.parent, profile);
}
	
	/**
	 * Need to add newline because <code>item</code> has too many inline children
	 * @param {AbbreviationNode} node
	 * @param {OutputProfile} profile
	 */
	function shouldBreakChild(node, profile) {
		// we need to test only one child element, because 
		// hasBlockChildren() method will do the rest
		return node.children.length && shouldAddLineBreak(node.children[0], profile);
	}
	
	function shouldFormatInline(node, profile) {
		var nodeCount = 0;
		var abbrUtils = require('abbreviationUtils');
		return !!_.find(node.children, function(child) {
			if (child.isTextNode() || !abbrUtils.isInline(child))
				nodeCount = 0;
			else if (abbrUtils.isInline(child))
				nodeCount++;
			
			if (nodeCount >= profile.inline_break)
				return true;
		});
	}
	
	function isRoot(item) {
		return !item.parent;
	}
	
	/**
	 * Processes element with matched resource of type <code>snippet</code>
	 * @param {AbbreviationNode} item
	 * @param {OutputProfile} profile
	 * @param {Number} level Depth level
	 */
	function processSnippet(item, profile, level) {
		item.start = item.end = '';
		if (!isVeryFirstChild(item) && profile.tag_nl !== false && shouldAddLineBreak(item, profile)) {
			// check if we’re not inside inline element
			if (isRoot(item.parent) || !require('abbreviationUtils').isInline(item.parent)) {
				item.start = require('utils').getNewline() + item.start;
			}
		}
		
		return item;
	}
	
	/**
	 * Check if we should add line breaks inside inline element
	 * @param {AbbreviationNode} node
	 * @param {OutputProfile} profile
	 * @return {Boolean}
	 */
	function shouldBreakInsideInline(node, profile) {
		var abbrUtils = require('abbreviationUtils');
		var hasBlockElems = _.any(node.children, function(child) {
			if (abbrUtils.isSnippet(child))
				return false;
			
			return !abbrUtils.isInline(child);
		});
		
		if (!hasBlockElems) {
			return shouldFormatInline(node, profile);
		}
		
		return true;
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {AbbreviationNode} item
	 * @param {OutputProfile} profile
	 * @param {Number} level Depth level
	 */
	function processTag(item, profile, level) {
		item.start = item.end = placeholder;
		var utils = require('utils');
		var abbrUtils = require('abbreviationUtils');
		var isUnary = abbrUtils.isUnary(item);
		var nl = utils.getNewline();
		var indent = getIndentation(item);
			
		// formatting output
		if (profile.tag_nl !== false) {
			var forceNl = profile.tag_nl === true && (profile.tag_nl_leaf || item.children.length);
			if (!forceNl) {
				forceNl = _.include(prefs.getArray('format.forceIndentationForTags') || [], item.name());
			}
			
			// formatting block-level elements
			if (!item.isTextNode()) {
				if (shouldAddLineBreak(item, profile)) {
					// - do not indent the very first element
					// - do not indent first child of a snippet
					if (!isVeryFirstChild(item) && (!abbrUtils.isSnippet(item.parent) || item.index()))
						item.start = nl + item.start;
						
					if (abbrUtils.hasBlockChildren(item) || shouldBreakChild(item, profile) || (forceNl && !isUnary))
						item.end = nl + item.end;
						
					if (abbrUtils.hasTagsInContent(item) || (forceNl && !item.children.length && !isUnary))
						item.start += nl + indent;
				} else if (abbrUtils.isInline(item) && hasBlockSibling(item) && !isVeryFirstChild(item)) {
					item.start = nl + item.start;
				} else if (abbrUtils.isInline(item) && shouldBreakInsideInline(item, profile)) {
					item.end = nl + item.end;
				}
				
				item.padding = indent;
			}
		}
		
		return item;
	}
	
	/**
	 * Processes simplified tree, making it suitable for output as HTML structure
	 * @param {AbbreviationNode} tree
	 * @param {OutputProfile} profile
	 * @param {Number} level Depth level
	 */
	require('filters').add('_format', function process(tree, profile, level) {
		level = level || 0;
		var abbrUtils = require('abbreviationUtils');
		
		_.each(tree.children, function(item) {
			if (abbrUtils.isSnippet(item))
				processSnippet(item, profile, level);
			else
				processTag(item, profile, level);
			
			process(item, profile, level + 1);
		});
		
		return tree;
	});
});;/**
 * Filter that produces HTML tree
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @constructor
 * @memberOf __htmlFilterDefine
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.exec(function(require, _) {
	/**
	 * Creates HTML attributes string from tag according to profile settings
	 * @param {AbbreviationNode} node
	 * @param {OutputProfile} profile
	 */
	function makeAttributesString(node, profile) {
		var attrQuote = profile.attributeQuote();
		var cursor = profile.cursor();
		
		return _.map(node.attributeList(), function(a) {
			var attrName = profile.attributeName(a.name);
			return ' ' + attrName + '=' + attrQuote + (a.value || cursor) + attrQuote;
		}).join('');
	}
	
	/**
	 * Processes element with <code>tag</code> type
	 * @param {AbbreviationNode} item
	 * @param {OutputProfile} profile
	 * @param {Number} level Depth level
	 */
	function processTag(item, profile, level) {
		if (!item.parent) // looks like it's root element
			return item;
		
		var abbrUtils = require('abbreviationUtils');
		var utils = require('utils');
		
		var attrs = makeAttributesString(item, profile); 
		var cursor = profile.cursor();
		var isUnary = abbrUtils.isUnary(item);
		var start= '';
		var end = '';
			
		// define opening and closing tags
		if (!item.isTextNode()) {
			var tagName = profile.tagName(item.name());
			if (isUnary) {
				start = '<' + tagName + attrs + profile.selfClosing() + '>';
				item.end = '';
			} else {
				start = '<' + tagName + attrs + '>';
				end = '</' + tagName + '>';
			}
		}
		
		var placeholder = '%s';
		// We can't just replace placeholder with new value because
		// JavaScript will treat double $ character as a single one, assuming
		// we're using RegExp literal.
		item.start = utils.replaceSubstring(item.start, start, item.start.indexOf(placeholder), placeholder);
		item.end = utils.replaceSubstring(item.end, end, item.end.indexOf(placeholder), placeholder);
		
		// should we put caret placeholder after opening tag?
		if (
				!item.children.length 
				&& !isUnary 
				&& !~item.content.indexOf(cursor)
				&& !require('tabStops').extract(item.content).tabstops.length
			) {
			item.start += cursor;
		}
		
		return item;
	}
	
	/**
	 * Processes simplified tree, making it suitable for output as HTML structure
	 * @param {AbbreviationNode} tree
	 * @param {Object} profile
	 * @param {Number} level Depth level
	 */
	require('filters').add('html', function process(tree, profile, level) {
		level = level || 0;
		var abbrUtils = require('abbreviationUtils');
		
		if (!level) {
			tree = require('filters').apply(tree, '_format', profile);
		}
		
		_.each(tree.children, function(item) {
			if (!abbrUtils.isSnippet(item))
				processTag(item, profile, level);
			
			process(item, profile, level + 1);
		});
		
		return tree;
	});
});;/* exported zen */
/**
 * A simple function to use Emmet in a web environment
 * @property {Boolean} [firstChild=false] When set to true the result to the zen function is an HTMLElement when the length of the NodeList is one. Default is false.
 * @param {string} abbreviation The Emmet abbreviation to expand.
 * @param {Object} [content] An optional content object to replace strings from the result.
 * @returns {Array} The Emmet result in an Array.
 * @version 0.1.2
 * @author Ron Valstar <ron@ronvalstar.nl>
 * @licence MIT: http://www.opensource.org/licenses/mit-license.php
 * @requires Emmet (currently using revision c973f3d)
 * @copyright Emmet 2012 Sergey Chikuyonok <serge.che@gmail.com>
 */
var zen = (function(emmet){
	'use strict';
	var mParent = document.createElement('div')
		,nChildren = mParent.childNodes
		,zen = function(abbreviation,content){
			var i
				,iLen
				,aReturn = []
				,sHtml = emmet.expandAbbreviation(abbreviation)
			;
			if (content!==undefined) {
				for (var key in content) {
					var value = content[key];
					if (value instanceof Array) {
						for (i=value.length;i>=0;i--) {
						  sHtml = sHtml.replace(new RegExp(key+(i+1),'g'),value[i]);
						}
					} else {
						sHtml = sHtml.replace(new RegExp(key,'g'),value);
					}
				}
			}
			mParent.innerHTML = sHtml;
			iLen = nChildren.length;
			if (zen.firstChild&&iLen===1) {
				aReturn = mParent.firstChild;
			} else { // return an Array because the NodeList is live
				for (i=0;i<iLen;i++) {
					aReturn.push(nChildren[i]);
				}
			}
			return aReturn;
		}
	;
	zen.firstChild = false;
	//zen.exposeEmmet = function(){window.emmet=emmet;};
	return zen;
})(emmet);;return zen;})();