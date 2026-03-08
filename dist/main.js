var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/argon2-browser/dist/argon2.js
var require_argon2 = __commonJS({
  "node_modules/argon2-browser/dist/argon2.js"(exports, module2) {
    var Module2 = typeof self !== "undefined" && typeof self.Module !== "undefined" ? self.Module : {};
    var jsModule = Module2;
    var moduleOverrides = {};
    var key;
    for (key in Module2) {
      if (Module2.hasOwnProperty(key)) {
        moduleOverrides[key] = Module2[key];
      }
    }
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = function(status, toThrow) {
      throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module2["locateFile"]) {
        return Module2["locateFile"](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var read_;
    var readAsync;
    var readBinary;
    var setWindowTitle;
    var nodeFS;
    var nodePath;
    if (ENVIRONMENT_IS_NODE) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/";
      } else {
        scriptDirectory = __dirname + "/";
      }
      read_ = function shell_read(filename, binary) {
        if (!nodeFS)
          nodeFS = require("fs");
        if (!nodePath)
          nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8");
      };
      readBinary = function readBinary2(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/");
      }
      arguments_ = process["argv"].slice(2);
      if (typeof module2 !== "undefined") {
        module2["exports"] = Module2;
      }
      process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      process["on"]("unhandledRejection", abort);
      quit_ = function(status) {
        process["exit"](status);
      };
      Module2["inspect"] = function() {
        return "[Emscripten Module object]";
      };
    } else if (ENVIRONMENT_IS_SHELL) {
      if (typeof read != "undefined") {
        read_ = function shell_read(f) {
          return read(f);
        };
      }
      readBinary = function readBinary2(f) {
        var data;
        if (typeof readbuffer === "function") {
          return new Uint8Array(readbuffer(f));
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data;
      };
      if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs;
      } else if (typeof arguments != "undefined") {
        arguments_ = arguments;
      }
      if (typeof quit === "function") {
        quit_ = function(status) {
          quit(status);
        };
      }
      if (typeof print !== "undefined") {
        if (typeof console === "undefined")
          console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
      }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
      } else {
        scriptDirectory = "";
      }
      {
        read_ = function(url) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send(null);
          return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = function(url) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }
        readAsync = function(url, onload, onerror) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
              onload(xhr.response);
              return;
            }
            onerror();
          };
          xhr.onerror = onerror;
          xhr.send(null);
        };
      }
      setWindowTitle = function(title) {
        document.title = title;
      };
    } else {
    }
    var out = Module2["print"] || console.log.bind(console);
    var err = Module2["printErr"] || console.warn.bind(console);
    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module2[key] = moduleOverrides[key];
      }
    }
    moduleOverrides = null;
    if (Module2["arguments"])
      arguments_ = Module2["arguments"];
    if (Module2["thisProgram"])
      thisProgram = Module2["thisProgram"];
    if (Module2["quit"])
      quit_ = Module2["quit"];
    var wasmBinary;
    if (Module2["wasmBinary"])
      wasmBinary = Module2["wasmBinary"];
    var noExitRuntime = Module2["noExitRuntime"] || true;
    if (typeof WebAssembly !== "object") {
      abort("no native wasm support detected");
    }
    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;
    function assert(condition, text) {
      if (!condition) {
        abort("Assertion failed: " + text);
      }
    }
    var ALLOC_NORMAL = 0;
    var ALLOC_STACK = 1;
    function allocate(slab, allocator) {
      var ret;
      if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length);
      } else {
        ret = _malloc(slab.length);
      }
      if (slab.subarray || slab.slice) {
        HEAPU8.set(slab, ret);
      } else {
        HEAPU8.set(new Uint8Array(slab), ret);
      }
      return ret;
    }
    var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : void 0;
    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      while (heap[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
      if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
      } else {
        var str = "";
        while (idx < endPtr) {
          var u0 = heap[idx++];
          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }
          var u1 = heap[idx++] & 63;
          if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
          }
          var u2 = heap[idx++] & 63;
          if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
          } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
          }
          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
          }
        }
      }
      return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }
    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - x % multiple;
      }
      return x;
    }
    var buffer;
    var HEAP8;
    var HEAPU8;
    var HEAP16;
    var HEAPU16;
    var HEAP32;
    var HEAPU32;
    var HEAPF32;
    var HEAPF64;
    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module2["HEAP8"] = HEAP8 = new Int8Array(buf);
      Module2["HEAP16"] = HEAP16 = new Int16Array(buf);
      Module2["HEAP32"] = HEAP32 = new Int32Array(buf);
      Module2["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
      Module2["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
      Module2["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
      Module2["HEAPF32"] = HEAPF32 = new Float32Array(buf);
      Module2["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }
    var INITIAL_MEMORY = Module2["INITIAL_MEMORY"] || 16777216;
    var wasmTable;
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    function preRun() {
      if (Module2["preRun"]) {
        if (typeof Module2["preRun"] == "function")
          Module2["preRun"] = [Module2["preRun"]];
        while (Module2["preRun"].length) {
          addOnPreRun(Module2["preRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true;
      callRuntimeCallbacks(__ATINIT__);
    }
    function postRun() {
      if (Module2["postRun"]) {
        if (typeof Module2["postRun"] == "function")
          Module2["postRun"] = [Module2["postRun"]];
        while (Module2["postRun"].length) {
          addOnPostRun(Module2["postRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function addRunDependency(id) {
      runDependencies++;
      if (Module2["monitorRunDependencies"]) {
        Module2["monitorRunDependencies"](runDependencies);
      }
    }
    function removeRunDependency(id) {
      runDependencies--;
      if (Module2["monitorRunDependencies"]) {
        Module2["monitorRunDependencies"](runDependencies);
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    Module2["preloadedImages"] = {};
    Module2["preloadedAudios"] = {};
    function abort(what) {
      if (Module2["onAbort"]) {
        Module2["onAbort"](what);
      }
      what += "";
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
      var e = new WebAssembly.RuntimeError(what);
      throw e;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
      return filename.startsWith(dataURIPrefix);
    }
    function isFileURI(filename) {
      return filename.startsWith("file://");
    }
    var wasmBinaryFile = "argon2.wasm";
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary(file) {
      try {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(file);
        } else {
          throw "both async and sync fetching of the wasm failed";
        }
      } catch (err2) {
        abort(err2);
      }
    }
    function getBinaryPromise() {
      if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
          return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
            if (!response["ok"]) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response["arrayBuffer"]();
          }).catch(function() {
            return getBinary(wasmBinaryFile);
          });
        } else {
          if (readAsync) {
            return new Promise(function(resolve, reject) {
              readAsync(wasmBinaryFile, function(response) {
                resolve(new Uint8Array(response));
              }, reject);
            });
          }
        }
      }
      return Promise.resolve().then(function() {
        return getBinary(wasmBinaryFile);
      });
    }
    function createWasm() {
      var info = { "a": asmLibraryArg };
      function receiveInstance(instance, module3) {
        var exports3 = instance.exports;
        Module2["asm"] = exports3;
        wasmMemory = Module2["asm"]["c"];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module2["asm"]["k"];
        addOnInit(Module2["asm"]["d"]);
        removeRunDependency("wasm-instantiate");
      }
      addRunDependency("wasm-instantiate");
      function receiveInstantiationResult(result) {
        receiveInstance(result["instance"]);
      }
      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
          var result = WebAssembly.instantiate(binary, info);
          return result;
        }).then(receiver, function(reason) {
          err("failed to asynchronously prepare wasm: " + reason);
          abort(reason);
        });
      }
      function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
          return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiationResult, function(reason) {
              err("wasm streaming compile failed: " + reason);
              err("falling back to ArrayBuffer instantiation");
              return instantiateArrayBuffer(receiveInstantiationResult);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiationResult);
        }
      }
      if (Module2["instantiateWasm"]) {
        try {
          var exports2 = Module2["instantiateWasm"](info, receiveInstance);
          return exports2;
        } catch (e) {
          err("Module.instantiateWasm callback failed with error: " + e);
          return false;
        }
      }
      instantiateAsync();
      return {};
    }
    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
          callback(Module2);
          continue;
        }
        var func = callback.func;
        if (typeof func === "number") {
          if (callback.arg === void 0) {
            wasmTable.get(func)();
          } else {
            wasmTable.get(func)(callback.arg);
          }
        } else {
          func(callback.arg === void 0 ? null : callback.arg);
        }
      }
    }
    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }
    function emscripten_realloc_buffer(size) {
      try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
      } catch (e) {
      }
    }
    function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      var maxHeapSize = 2147418112;
      if (requestedSize > maxHeapSize) {
        return false;
      }
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
          return true;
        }
      }
      return false;
    }
    var asmLibraryArg = { "a": _emscripten_memcpy_big, "b": _emscripten_resize_heap };
    var asm = createWasm();
    var ___wasm_call_ctors = Module2["___wasm_call_ctors"] = function() {
      return (___wasm_call_ctors = Module2["___wasm_call_ctors"] = Module2["asm"]["d"]).apply(null, arguments);
    };
    var _argon2_hash = Module2["_argon2_hash"] = function() {
      return (_argon2_hash = Module2["_argon2_hash"] = Module2["asm"]["e"]).apply(null, arguments);
    };
    var _malloc = Module2["_malloc"] = function() {
      return (_malloc = Module2["_malloc"] = Module2["asm"]["f"]).apply(null, arguments);
    };
    var _free = Module2["_free"] = function() {
      return (_free = Module2["_free"] = Module2["asm"]["g"]).apply(null, arguments);
    };
    var _argon2_verify = Module2["_argon2_verify"] = function() {
      return (_argon2_verify = Module2["_argon2_verify"] = Module2["asm"]["h"]).apply(null, arguments);
    };
    var _argon2_error_message = Module2["_argon2_error_message"] = function() {
      return (_argon2_error_message = Module2["_argon2_error_message"] = Module2["asm"]["i"]).apply(null, arguments);
    };
    var _argon2_encodedlen = Module2["_argon2_encodedlen"] = function() {
      return (_argon2_encodedlen = Module2["_argon2_encodedlen"] = Module2["asm"]["j"]).apply(null, arguments);
    };
    var _argon2_hash_ext = Module2["_argon2_hash_ext"] = function() {
      return (_argon2_hash_ext = Module2["_argon2_hash_ext"] = Module2["asm"]["l"]).apply(null, arguments);
    };
    var _argon2_verify_ext = Module2["_argon2_verify_ext"] = function() {
      return (_argon2_verify_ext = Module2["_argon2_verify_ext"] = Module2["asm"]["m"]).apply(null, arguments);
    };
    var stackAlloc = Module2["stackAlloc"] = function() {
      return (stackAlloc = Module2["stackAlloc"] = Module2["asm"]["n"]).apply(null, arguments);
    };
    Module2["allocate"] = allocate;
    Module2["UTF8ToString"] = UTF8ToString;
    Module2["ALLOC_NORMAL"] = ALLOC_NORMAL;
    var calledRun;
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }
    dependenciesFulfilled = function runCaller() {
      if (!calledRun)
        run();
      if (!calledRun)
        dependenciesFulfilled = runCaller;
    };
    function run(args) {
      args = args || arguments_;
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) {
        return;
      }
      function doRun() {
        if (calledRun)
          return;
        calledRun = true;
        Module2["calledRun"] = true;
        if (ABORT)
          return;
        initRuntime();
        if (Module2["onRuntimeInitialized"])
          Module2["onRuntimeInitialized"]();
        postRun();
      }
      if (Module2["setStatus"]) {
        Module2["setStatus"]("Running...");
        setTimeout(function() {
          setTimeout(function() {
            Module2["setStatus"]("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    Module2["run"] = run;
    if (Module2["preInit"]) {
      if (typeof Module2["preInit"] == "function")
        Module2["preInit"] = [Module2["preInit"]];
      while (Module2["preInit"].length > 0) {
        Module2["preInit"].pop()();
      }
    }
    run();
    if (typeof module2 !== "undefined")
      module2.exports = Module2;
    Module2.unloadRuntime = function() {
      if (typeof self !== "undefined") {
        delete self.Module;
      }
      Module2 = jsModule = wasmMemory = wasmTable = asm = buffer = HEAP8 = HEAPU8 = HEAP16 = HEAPU16 = HEAP32 = HEAPU32 = HEAPF32 = HEAPF64 = void 0;
      if (typeof module2 !== "undefined") {
        delete module2.exports;
      }
    };
  }
});

// node_modules/argon2-browser/dist/argon2.wasm
var require_argon22 = __commonJS({
  "node_modules/argon2-browser/dist/argon2.wasm"(exports, module2) {
    module2.exports = "./argon2.wasm";
  }
});

// node_modules/argon2-browser/lib/argon2.js
var require_argon23 = __commonJS({
  "node_modules/argon2-browser/lib/argon2.js"(exports, module2) {
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root.argon2 = factory();
      }
    })(typeof self !== "undefined" ? self : exports, function() {
      const global = typeof self !== "undefined" ? self : this;
      const ArgonType2 = {
        Argon2d: 0,
        Argon2i: 1,
        Argon2id: 2
      };
      function loadModule(mem) {
        if (loadModule._promise) {
          return loadModule._promise;
        }
        if (loadModule._module) {
          return Promise.resolve(loadModule._module);
        }
        let promise;
        if (global.process && global.process.versions && global.process.versions.node) {
          promise = loadWasmModule().then(
            (Module2) => new Promise((resolve) => {
              Module2.postRun = () => resolve(Module2);
            })
          );
        } else {
          promise = loadWasmBinary().then((wasmBinary) => {
            const wasmMemory = mem ? createWasmMemory(mem) : void 0;
            return initWasm(wasmBinary, wasmMemory);
          });
        }
        loadModule._promise = promise;
        return promise.then((Module2) => {
          loadModule._module = Module2;
          delete loadModule._promise;
          return Module2;
        });
      }
      function initWasm(wasmBinary, wasmMemory) {
        return new Promise((resolve) => {
          global.Module = {
            wasmBinary,
            wasmMemory,
            postRun() {
              resolve(Module);
            }
          };
          return loadWasmModule();
        });
      }
      function loadWasmModule() {
        if (global.loadArgon2WasmModule) {
          return global.loadArgon2WasmModule();
        }
        if (typeof require === "function") {
          return Promise.resolve(require_argon2());
        }
        return Promise.resolve().then(() => __toESM(require_argon2()));
      }
      function loadWasmBinary() {
        if (global.loadArgon2WasmBinary) {
          return global.loadArgon2WasmBinary();
        }
        if (typeof require === "function") {
          return Promise.resolve(require_argon22()).then(
            (wasmModule) => {
              return decodeWasmBinary(wasmModule);
            }
          );
        }
        const wasmPath = global.argon2WasmPath || "node_modules/argon2-browser/dist/argon2.wasm";
        return fetch(wasmPath).then((response) => response.arrayBuffer()).then((ab) => new Uint8Array(ab));
      }
      function decodeWasmBinary(base64) {
        const text = atob(base64);
        const binary = new Uint8Array(new ArrayBuffer(text.length));
        for (let i = 0; i < text.length; i++) {
          binary[i] = text.charCodeAt(i);
        }
        return binary;
      }
      function createWasmMemory(mem) {
        const KB = 1024;
        const MB = 1024 * KB;
        const GB = 1024 * MB;
        const WASM_PAGE_SIZE = 64 * KB;
        const totalMemory = (2 * GB - 64 * KB) / WASM_PAGE_SIZE;
        const initialMemory = Math.min(
          Math.max(Math.ceil(mem * KB / WASM_PAGE_SIZE), 256) + 256,
          totalMemory
        );
        return new WebAssembly.Memory({
          initial: initialMemory,
          maximum: totalMemory
        });
      }
      function allocateArray(Module2, arr) {
        return Module2.allocate(arr, "i8", Module2.ALLOC_NORMAL);
      }
      function allocateArrayStr(Module2, arr) {
        const nullTerminatedArray = new Uint8Array([...arr, 0]);
        return allocateArray(Module2, nullTerminatedArray);
      }
      function encodeUtf8(str) {
        if (typeof str !== "string") {
          return str;
        }
        if (typeof TextEncoder === "function") {
          return new TextEncoder().encode(str);
        } else if (typeof Buffer === "function") {
          return Buffer.from(str);
        } else {
          throw new Error("Don't know how to encode UTF8");
        }
      }
      function argon2Hash2(params) {
        const mCost = params.mem || 1024;
        return loadModule(mCost).then((Module2) => {
          const tCost = params.time || 1;
          const parallelism = params.parallelism || 1;
          const pwdEncoded = encodeUtf8(params.pass);
          const pwd = allocateArrayStr(Module2, pwdEncoded);
          const pwdlen = pwdEncoded.length;
          const saltEncoded = encodeUtf8(params.salt);
          const salt = allocateArrayStr(Module2, saltEncoded);
          const saltlen = saltEncoded.length;
          const argon2Type = params.type || ArgonType2.Argon2d;
          const hash = Module2.allocate(
            new Array(params.hashLen || 24),
            "i8",
            Module2.ALLOC_NORMAL
          );
          const secret = params.secret ? allocateArray(Module2, params.secret) : 0;
          const secretlen = params.secret ? params.secret.byteLength : 0;
          const ad = params.ad ? allocateArray(Module2, params.ad) : 0;
          const adlen = params.ad ? params.ad.byteLength : 0;
          const hashlen = params.hashLen || 24;
          const encodedlen = Module2._argon2_encodedlen(
            tCost,
            mCost,
            parallelism,
            saltlen,
            hashlen,
            argon2Type
          );
          const encoded = Module2.allocate(
            new Array(encodedlen + 1),
            "i8",
            Module2.ALLOC_NORMAL
          );
          const version = 19;
          let err;
          let res;
          try {
            res = Module2._argon2_hash_ext(
              tCost,
              mCost,
              parallelism,
              pwd,
              pwdlen,
              salt,
              saltlen,
              hash,
              hashlen,
              encoded,
              encodedlen,
              argon2Type,
              secret,
              secretlen,
              ad,
              adlen,
              version
            );
          } catch (e) {
            err = e;
          }
          let result;
          if (res === 0 && !err) {
            let hashStr = "";
            const hashArr = new Uint8Array(hashlen);
            for (let i = 0; i < hashlen; i++) {
              const byte = Module2.HEAP8[hash + i];
              hashArr[i] = byte;
              hashStr += ("0" + (255 & byte).toString(16)).slice(-2);
            }
            const encodedStr = Module2.UTF8ToString(encoded);
            result = {
              hash: hashArr,
              hashHex: hashStr,
              encoded: encodedStr
            };
          } else {
            try {
              if (!err) {
                err = Module2.UTF8ToString(
                  Module2._argon2_error_message(res)
                );
              }
            } catch (e) {
            }
            result = { message: err, code: res };
          }
          try {
            Module2._free(pwd);
            Module2._free(salt);
            Module2._free(hash);
            Module2._free(encoded);
            if (ad) {
              Module2._free(ad);
            }
            if (secret) {
              Module2._free(secret);
            }
          } catch (e) {
          }
          if (err) {
            throw result;
          } else {
            return result;
          }
        });
      }
      function argon2Verify(params) {
        return loadModule().then((Module2) => {
          const pwdEncoded = encodeUtf8(params.pass);
          const pwd = allocateArrayStr(Module2, pwdEncoded);
          const pwdlen = pwdEncoded.length;
          const secret = params.secret ? allocateArray(Module2, params.secret) : 0;
          const secretlen = params.secret ? params.secret.byteLength : 0;
          const ad = params.ad ? allocateArray(Module2, params.ad) : 0;
          const adlen = params.ad ? params.ad.byteLength : 0;
          const encEncoded = encodeUtf8(params.encoded);
          const enc = allocateArrayStr(Module2, encEncoded);
          let argon2Type = params.type;
          if (argon2Type === void 0) {
            let typeStr = params.encoded.split("$")[1];
            if (typeStr) {
              typeStr = typeStr.replace("a", "A");
              argon2Type = ArgonType2[typeStr] || ArgonType2.Argon2d;
            }
          }
          let err;
          let res;
          try {
            res = Module2._argon2_verify_ext(
              enc,
              pwd,
              pwdlen,
              secret,
              secretlen,
              ad,
              adlen,
              argon2Type
            );
          } catch (e) {
            err = e;
          }
          let result;
          if (res || err) {
            try {
              if (!err) {
                err = Module2.UTF8ToString(
                  Module2._argon2_error_message(res)
                );
              }
            } catch (e) {
            }
            result = { message: err, code: res };
          }
          try {
            Module2._free(pwd);
            Module2._free(enc);
          } catch (e) {
          }
          if (err) {
            throw result;
          } else {
            return result;
          }
        });
      }
      function unloadRuntime() {
        if (loadModule._module) {
          loadModule._module.unloadRuntime();
          delete loadModule._promise;
          delete loadModule._module;
        }
      }
      return {
        ArgonType: ArgonType2,
        hash: argon2Hash2,
        verify: argon2Verify,
        unloadRuntime
      };
    });
  }
});

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => VaultCipherPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/crypto.js
var import_argon2_browser = __toESM(require_argon23());

// node_modules/@noble/hashes/esm/crypto.js
var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/@noble/hashes/esm/utils.js
function randomBytes(bytesLength = 32) {
  if (crypto && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto && typeof crypto.randomBytes === "function") {
    return Uint8Array.from(crypto.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}

// node_modules/@noble/ciphers/esm/_assert.js
function number(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`positive integer expected, not ${n}`);
}
function bool(b) {
  if (typeof b !== "boolean")
    throw new Error(`boolean expected, not ${b}`);
}
function isBytes(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function bytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
}
function exists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
  bytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error(`digestInto() expects output buffer of length at least ${min}`);
  }
}

// node_modules/@noble/ciphers/esm/utils.js
var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
if (!isLE)
  throw new Error("Non little-endian hardware is not supported");
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error(`string expected, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  else if (isBytes(data))
    data = data.slice();
  else
    throw new Error(`Uint8Array expected, got ${typeof data}`);
  return data;
}
function checkOpts(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, c) => {
  Object.assign(c, params);
  return c;
};
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}

// node_modules/@noble/ciphers/esm/_poly1305.js
var u8to16 = (a, i) => a[i++] & 255 | (a[i++] & 255) << 8;
var Poly1305 = class {
  constructor(key) {
    this.blockLen = 16;
    this.outputLen = 16;
    this.buffer = new Uint8Array(16);
    this.r = new Uint16Array(10);
    this.h = new Uint16Array(10);
    this.pad = new Uint16Array(8);
    this.pos = 0;
    this.finished = false;
    key = toBytes(key);
    bytes(key, 32);
    const t0 = u8to16(key, 0);
    const t1 = u8to16(key, 2);
    const t2 = u8to16(key, 4);
    const t3 = u8to16(key, 6);
    const t4 = u8to16(key, 8);
    const t5 = u8to16(key, 10);
    const t6 = u8to16(key, 12);
    const t7 = u8to16(key, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i = 0; i < 8; i++)
      this.pad[i] = u8to16(key, 16 + 2 * i);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r } = this;
    const r0 = r[0];
    const r1 = r[1];
    const r2 = r[2];
    const r3 = r[3];
    const r4 = r[4];
    const r5 = r[5];
    const r6 = r[6];
    const r7 = r[7];
    const r8 = r[8];
    const r9 = r[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c = 0;
    let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
    c += d0 >>> 13;
    d0 &= 8191;
    let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
    c += d1 >>> 13;
    d1 &= 8191;
    let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c += d2 >>> 13;
    d2 &= 8191;
    let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c += d3 >>> 13;
    d3 &= 8191;
    let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    c = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c += d4 >>> 13;
    d4 &= 8191;
    let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
    c = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c += d5 >>> 13;
    d5 &= 8191;
    let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
    c = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c += d6 >>> 13;
    d6 &= 8191;
    let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c += d7 >>> 13;
    d7 &= 8191;
    let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c += d8 >>> 13;
    d8 &= 8191;
    let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
    c += d9 >>> 13;
    d9 &= 8191;
    c = (c << 2) + c | 0;
    c = c + d0 | 0;
    d0 = c & 8191;
    c = c >>> 13;
    d1 += c;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad } = this;
    const g = new Uint16Array(10);
    let c = h[1] >>> 13;
    h[1] &= 8191;
    for (let i = 2; i < 10; i++) {
      h[i] += c;
      c = h[i] >>> 13;
      h[i] &= 8191;
    }
    h[0] += c * 5;
    c = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c;
    c = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c;
    g[0] = h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 8191;
    for (let i = 1; i < 10; i++) {
      g[i] = h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask = (c ^ 1) - 1;
    for (let i = 0; i < 10; i++)
      g[i] &= mask;
    mask = ~mask;
    for (let i = 0; i < 10; i++)
      h[i] = h[i] & mask | g[i];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f = h[0] + pad[0];
    h[0] = f & 65535;
    for (let i = 1; i < 8; i++) {
      f = (h[i] + pad[i] | 0) + (f >>> 16) | 0;
      h[i] = f & 65535;
    }
  }
  update(data) {
    exists(this);
    const { buffer, blockLen } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    this.h.fill(0);
    this.r.fill(0);
    this.buffer.fill(0);
    this.pad.fill(0);
  }
  digestInto(out) {
    exists(this);
    output(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i = 0; i < 8; i++) {
      out[opos++] = h[i] >>> 0;
      out[opos++] = h[i] >>> 8;
    }
    return out;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
function wrapConstructorWithKey(hashCons) {
  const hashC = (msg, key) => hashCons(key).update(toBytes(msg)).digest();
  const tmp = hashCons(new Uint8Array(32));
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (key) => hashCons(key);
  return hashC;
}
var poly1305 = wrapConstructorWithKey((key) => new Poly1305(key));

// node_modules/@noble/ciphers/esm/_arx.js
var _utf8ToBytes = (str) => Uint8Array.from(str.split("").map((c) => c.charCodeAt(0)));
var sigma16 = _utf8ToBytes("expand 16-byte k");
var sigma32 = _utf8ToBytes("expand 32-byte k");
var sigma16_32 = u32(sigma16);
var sigma32_32 = u32(sigma32);
var sigma = sigma32_32.slice();
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
function isAligned32(b) {
  return b.byteOffset % 4 === 0;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = 2 ** 32 - 1;
var U32_EMPTY = new Uint32Array();
function runCipher(core, sigma2, key, nonce, data, output2, counter, rounds) {
  const len = data.length;
  const block = new Uint8Array(BLOCK_LEN);
  const b32 = u32(block);
  const isAligned = isAligned32(data) && isAligned32(output2);
  const d32 = isAligned ? u32(data) : U32_EMPTY;
  const o32 = isAligned ? u32(output2) : U32_EMPTY;
  for (let pos = 0; pos < len; counter++) {
    core(sigma2, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output2[posj] = data[posj] ^ block[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  number(counterLength);
  number(rounds);
  bool(counterRight);
  bool(allowShortKeys);
  return (key, nonce, data, output2, counter = 0) => {
    bytes(key);
    bytes(nonce);
    bytes(data);
    const len = data.length;
    if (!output2)
      output2 = new Uint8Array(len);
    bytes(output2);
    number(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    if (output2.length < len)
      throw new Error(`arx: output (${output2.length}) is shorter than data (${len})`);
    const toClean = [];
    let l = key.length, k, sigma2;
    if (l === 32) {
      k = key.slice();
      toClean.push(k);
      sigma2 = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma2 = sigma16_32;
      toClean.push(k);
    } else {
      throw new Error(`arx: invalid 32-byte key, got length=${l}`);
    }
    if (!isAligned32(nonce)) {
      nonce = nonce.slice();
      toClean.push(nonce);
    }
    const k32 = u32(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      extendNonceFn(sigma2, k32, u32(nonce.subarray(0, 16)), k32);
      nonce = nonce.subarray(16);
    }
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = u32(nonce);
    runCipher(core, sigma2, k32, n32, data, output2, counter, rounds);
    while (toClean.length > 0)
      toClean.pop().fill(0);
    return output2;
  };
}

// node_modules/@noble/ciphers/esm/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
function hchacha(s, k, i, o32) {
  let x00 = s[0], x01 = s[1], x02 = s[2], x03 = s[3], x04 = k[0], x05 = k[1], x06 = k[2], x07 = k[3], x08 = k[4], x09 = k[5], x10 = k[6], x11 = k[7], x12 = i[0], x13 = i[1], x14 = i[2], x15 = i[3];
  for (let r = 0; r < 20; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  o32[oi++] = x00;
  o32[oi++] = x01;
  o32[oi++] = x02;
  o32[oi++] = x03;
  o32[oi++] = x12;
  o32[oi++] = x13;
  o32[oi++] = x14;
  o32[oi++] = x15;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var xchacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 8,
  extendNonceFn: hchacha,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const left = msg.length % 16;
  if (left)
    h.update(ZEROS16.subarray(left));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, data, AAD) {
  const authKey = fn(key, nonce, ZEROS32);
  const h = poly1305.create(authKey);
  if (AAD)
    updatePadded(h, AAD);
  updatePadded(h, data);
  const num = new Uint8Array(16);
  const view = createView(num);
  setBigUint64(view, 0, BigInt(AAD ? AAD.length : 0), true);
  setBigUint64(view, 8, BigInt(data.length), true);
  h.update(num);
  const res = h.digest();
  authKey.fill(0);
  return res;
}
var _poly1305_aead = (xorStream) => (key, nonce, AAD) => {
  const tagLength = 16;
  bytes(key, 32);
  bytes(nonce);
  return {
    encrypt: (plaintext, output2) => {
      const plength = plaintext.length;
      const clength = plength + tagLength;
      if (output2) {
        bytes(output2, clength);
      } else {
        output2 = new Uint8Array(clength);
      }
      xorStream(key, nonce, plaintext, output2, 1);
      const tag = computeTag(xorStream, key, nonce, output2.subarray(0, -tagLength), AAD);
      output2.set(tag, plength);
      return output2;
    },
    decrypt: (ciphertext, output2) => {
      const clength = ciphertext.length;
      const plength = clength - tagLength;
      if (clength < tagLength)
        throw new Error(`encrypted data must be at least ${tagLength} bytes`);
      if (output2) {
        bytes(output2, plength);
      } else {
        output2 = new Uint8Array(plength);
      }
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = computeTag(xorStream, key, nonce, data, AAD);
      if (!equalBytes(passedTag, tag))
        throw new Error("invalid tag");
      xorStream(key, nonce, data, output2, 1);
      return output2;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 12, tagLength: 16 }, _poly1305_aead(chacha20));
var xchacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 24, tagLength: 16 }, _poly1305_aead(xchacha20));

// src/crypto.js
var ARGON2_MEM = 128 * 1024;
var ARGON2_TIME = 3;
var ARGON2_PARALLELISM = 1;
var ARGON2_KEY_LEN = 32;
var SALT_LEN = 16;
var NONCE_LEN = 12;
var KEY_LEN = 32;
async function deriveKey(password, salt) {
  const result = await (0, import_argon2_browser.hash)({
    pass: password,
    salt,
    time: ARGON2_TIME,
    mem: ARGON2_MEM,
    parallelism: ARGON2_PARALLELISM,
    hashLen: ARGON2_KEY_LEN,
    type: import_argon2_browser.ArgonType.Argon2id
  });
  return result.hash;
}
function generateVaultKey() {
  return randomBytes(KEY_LEN);
}
function encryptBytes(key, data) {
  const nonce = randomBytes(NONCE_LEN);
  const ciphertext = chacha20poly1305(key, nonce).encrypt(data);
  const out = new Uint8Array(NONCE_LEN + ciphertext.length);
  out.set(nonce, 0);
  out.set(ciphertext, NONCE_LEN);
  return out;
}
function decryptBytes(key, blob) {
  const nonce = blob.slice(0, NONCE_LEN);
  const ciphertext = blob.slice(NONCE_LEN);
  return chacha20poly1305(key, nonce).decrypt(ciphertext);
}
async function createKeyBlob(password, vaultKey) {
  const salt = randomBytes(SALT_LEN);
  const derivedKey = await deriveKey(password, salt);
  const encrypted = encryptBytes(derivedKey, vaultKey);
  return JSON.stringify({
    v: 1,
    salt: toHex(salt),
    encryptedKey: toHex(encrypted)
  });
}
async function unlockKeyBlob(password, blobJson) {
  const blob = JSON.parse(blobJson);
  if (blob.v !== 1)
    throw new Error("Unsupported key blob version");
  if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
    throw new Error("Key blob: invalid or missing salt");
  if (typeof blob.encryptedKey !== "string" || blob.encryptedKey.length < NONCE_LEN * 2)
    throw new Error("Key blob: invalid or missing encryptedKey");
  const salt = fromHex(blob.salt);
  const encryptedKey = fromHex(blob.encryptedKey);
  const derivedKey = await deriveKey(password, salt);
  return decryptBytes(derivedKey, encryptedKey);
}
function encryptNote(vaultKey, plaintext) {
  const ptBytes = new TextEncoder().encode(plaintext);
  return toBase64(encryptBytes(vaultKey, ptBytes));
}
function decryptNote(vaultKey, ciphertextB64) {
  const ptBytes = decryptBytes(vaultKey, fromBase64(ciphertextB64));
  return new TextDecoder().decode(ptBytes);
}
function toHex(bytes2) {
  return Array.from(bytes2).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++)
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}
function toBase64(bytes2) {
  let binary = "";
  for (let i = 0; i < bytes2.length; i++)
    binary += String.fromCharCode(bytes2[i]);
  return btoa(binary);
}
function fromBase64(b64) {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    arr[i] = binary.charCodeAt(i);
  return arr;
}

// src/modals.js
var import_obsidian = require("obsidian");
function makePasswordField(parent, placeholder, autocomplete = "current-password") {
  const wrap = parent.createDiv({ cls: "vault-cipher-input-wrap" });
  const input = wrap.createEl("input", { type: "password", placeholder });
  input.autocomplete = autocomplete;
  const eye = wrap.createEl("button", { cls: "vault-cipher-eye", text: "\u{1F441}" });
  eye.type = "button";
  eye.setAttribute("aria-label", "Show/hide password");
  eye.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    eye.textContent = isHidden ? "\u{1F648}" : "\u{1F441}";
  });
  return { wrap, input };
}
function scorePassword(pw) {
  if (!pw)
    return 0;
  let score = 0;
  if (pw.length >= 8)
    score++;
  if (pw.length >= 14)
    score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))
    score++;
  if (/[0-9]/.test(pw))
    score++;
  if (/[^A-Za-z0-9]/.test(pw))
    score++;
  return Math.min(score, 4);
}
var STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
var STRENGTH_CLASS = ["", "is-error", "is-warn", "is-warn", "is-ok"];
function makeStrengthMeter(parent) {
  const barRow = parent.createDiv({ cls: "vault-cipher-strength" });
  const bars = Array.from(
    { length: 4 },
    () => barRow.createDiv({ cls: "vault-cipher-strength-bar" })
  );
  const hint = parent.createDiv({ cls: "vault-cipher-hint" });
  function update(pw) {
    const score = scorePassword(pw);
    bars.forEach((b, i) => {
      b.className = "vault-cipher-strength-bar";
      if (pw.length > 0 && i < score)
        b.classList.add(`active-${score}`);
    });
    if (!pw) {
      hint.textContent = "";
      hint.className = "vault-cipher-hint";
    } else {
      hint.textContent = STRENGTH_LABEL[score] || "Weak";
      hint.className = `vault-cipher-hint ${STRENGTH_CLASS[score]}`;
    }
  }
  return { bars, hint, update };
}
var SetupModal = class extends import_obsidian.Modal {
  constructor(app, plugin, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
    this.password = "";
    this.confirm = "";
  }
  async onOpen() {
    const { contentEl } = this;
    try {
      if (await this.plugin.keyBlobExists()) {
        this.close();
        new UnlockModal(
          this.app,
          (pw) => this.plugin.unlockWithPassword(pw)
        ).open();
        return;
      }
    } catch (e) {
    }
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "\u{1F510}", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Set Up Vault Cipher" });
    contentEl.createEl("p", {
      text: "Your notes will be encrypted on disk and only readable while your vault is unlocked.",
      cls: "vault-cipher-subtitle"
    });
    const how = contentEl.createDiv({ cls: "vault-cipher-how" });
    how.createEl("strong", { text: "How it works" });
    const steps = how.createEl("ol");
    [
      "A random 256-bit vault key is generated for this vault.",
      "Your password is hashed with Argon2id (128 MB, 3 iterations) producing a wrapping key.",
      "The wrapping key encrypts the vault key with ChaCha20-Poly1305 \u2014 stored as .vault-key.",
      "Every note is encrypted with the vault key + a unique random nonce on each save.",
      "On unlock, your password unwraps the vault key into memory. Notes decrypt transparently."
    ].forEach((s) => steps.createEl("li", { text: s }));
    const warning = contentEl.createDiv({ cls: "vault-cipher-warning" });
    warning.createSpan({ text: "\u26A0\uFE0F", cls: "vault-cipher-warning-icon" });
    const wt = warning.createDiv({ cls: "vault-cipher-warning-text" });
    wt.createEl("strong", { text: "No password recovery" });
    wt.createEl("span", {
      text: "If you forget your password, your notes are permanently unrecoverable. There is no reset, no backdoor. Store your password in a password manager."
    });
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const { input: pwInput } = makePasswordField(pwField, "Choose a strong password\u2026", "new-password");
    const strength = makeStrengthMeter(pwField);
    const cfField = fields.createDiv({ cls: "vault-cipher-field" });
    cfField.createEl("label", { text: "Confirm password" });
    const { input: cfInput } = makePasswordField(cfField, "Repeat password\u2026", "new-password");
    const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });
    const validate = () => {
      this.password = pwInput.value;
      this.confirm = cfInput.value;
      strength.update(this.password);
      if (this.confirm.length === 0) {
        cfHint.textContent = "";
        cfHint.className = "vault-cipher-hint";
        cfInput.classList.remove("is-error");
      } else if (this.confirm === this.password) {
        cfHint.textContent = "\u2713 Passwords match";
        cfHint.className = "vault-cipher-hint is-ok";
        cfInput.classList.remove("is-error");
      } else {
        cfHint.textContent = "Passwords don't match";
        cfHint.className = "vault-cipher-hint is-error";
        cfInput.classList.add("is-error");
      }
    };
    pwInput.addEventListener("input", validate);
    cfInput.addEventListener("input", validate);
    cfInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        this.submit(pwInput, cfInput, setupBtn);
    });
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new import_obsidian.Notice("Vault Cipher: setup cancelled. Notes will not be encrypted.");
    });
    const altBtn = buttonRow.createEl("button", {
      text: "I already have a key",
      cls: "btn-secondary"
    });
    altBtn.addEventListener("click", () => {
      this.close();
      new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
    });
    const setupBtn = buttonRow.createEl("button", {
      text: "Set up encryption",
      cls: "btn-primary"
    });
    setupBtn.addEventListener("click", () => this.submit(pwInput, cfInput, setupBtn));
    setTimeout(() => pwInput.focus(), 50);
  }
  async submit(pwInput, cfInput, btn) {
    try {
      if (await this.plugin.keyBlobExists()) {
        new import_obsidian.Notice("A vault key was detected \u2014 unlocking instead.");
        this.close();
        new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
        return;
      }
    } catch (e) {
    }
    if (!this.password) {
      pwInput.focus();
      return;
    }
    if (this.password.length < 8) {
      new import_obsidian.Notice("Password must be at least 8 characters.");
      pwInput.focus();
      return;
    }
    if (this.password !== this.confirm) {
      new import_obsidian.Notice("Passwords don't match.");
      cfInput.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = "Setting up\u2026 (Argon2id hashing, takes a moment)";
    try {
      await this.onSubmit(this.password);
      new import_obsidian.Notice("\u2705 Vault Cipher active. Your notes are now encrypted.");
      this.close();
    } catch (e) {
      console.error("Vault Cipher setup error:", e);
      new import_obsidian.Notice("\u274C Setup failed: " + e.message);
      btn.disabled = false;
      btn.textContent = "Set up encryption";
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var UnlockModal = class extends import_obsidian.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.password = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "\u{1F512}", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Vault Locked" });
    contentEl.createEl("p", {
      text: "Enter your vault password. The vault key will be held in memory until you lock or close Obsidian.",
      cls: "vault-cipher-subtitle"
    });
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const { input: pwInput } = makePasswordField(pwField, "Enter vault password\u2026", "current-password");
    pwInput.addEventListener("input", () => {
      this.password = pwInput.value;
    });
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        this.submit(pwInput, unlockBtn);
    });
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new import_obsidian.Notice("Vault remains locked. Encrypted notes will show as ciphertext.");
    });
    const unlockBtn = buttonRow.createEl("button", { text: "Unlock", cls: "btn-primary" });
    unlockBtn.addEventListener("click", () => this.submit(pwInput, unlockBtn));
    setTimeout(() => pwInput.focus(), 50);
  }
  async submit(pwInput, btn) {
    if (!this.password) {
      pwInput.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = "Unlocking\u2026";
    try {
      const success = await this.onSubmit(this.password);
      if (success) {
        new import_obsidian.Notice("\u2705 Vault unlocked.");
        this.close();
      } else {
        new import_obsidian.Notice("\u274C Wrong password.");
        btn.disabled = false;
        btn.textContent = "Unlock";
        pwInput.value = "";
        this.password = "";
        pwInput.focus();
      }
    } catch (e) {
      console.error("Vault Cipher unlock error:", e);
      new import_obsidian.Notice("\u274C Unlock failed: " + e.message);
      btn.disabled = false;
      btn.textContent = "Unlock";
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ChangePasswordModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.current = "";
    this.newPass = "";
    this.confirm = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "\u{1F511}", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Change Vault Password" });
    const isUnlocked = !!this.plugin.sessionKey;
    contentEl.createEl("p", {
      text: isUnlocked ? "Enter a new password to re-wrap the vault key." : "Enter your current password and a new password.",
      cls: "vault-cipher-subtitle"
    });
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
    let curInput = null;
    if (!isUnlocked) {
      const curField = fields.createDiv({ cls: "vault-cipher-field" });
      curField.createEl("label", { text: "Current password" });
      const pw = makePasswordField(curField, "Current password\u2026", "current-password");
      curInput = pw.input;
      curInput.addEventListener("input", () => {
        this.current = curInput.value;
      });
    }
    const newField = fields.createDiv({ cls: "vault-cipher-field" });
    newField.createEl("label", { text: "New password" });
    const { input: newInput } = makePasswordField(newField, "New password\u2026", "new-password");
    const strength = makeStrengthMeter(newField);
    newInput.addEventListener("input", () => {
      this.newPass = newInput.value;
      strength.update(this.newPass);
    });
    const cfField = fields.createDiv({ cls: "vault-cipher-field" });
    cfField.createEl("label", { text: "Confirm new password" });
    const { input: cfInput } = makePasswordField(cfField, "Repeat new password\u2026", "new-password");
    const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });
    cfInput.addEventListener("input", () => {
      this.confirm = cfInput.value;
      if (!this.confirm) {
        cfHint.textContent = "";
        cfHint.className = "vault-cipher-hint";
      } else if (this.confirm === this.newPass) {
        cfHint.textContent = "\u2713 Passwords match";
        cfHint.className = "vault-cipher-hint is-ok";
      } else {
        cfHint.textContent = "Passwords don't match";
        cfHint.className = "vault-cipher-hint is-error";
      }
    });
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());
    const saveBtn = buttonRow.createEl("button", { text: "Change password", cls: "btn-primary" });
    saveBtn.addEventListener("click", () => this.submit(saveBtn, newInput, cfInput));
  }
  async submit(btn, newInput, cfInput) {
    if (!this.newPass || this.newPass.length < 8) {
      new import_obsidian.Notice("New password must be at least 8 characters.");
      newInput.focus();
      return;
    }
    if (this.newPass !== this.confirm) {
      new import_obsidian.Notice("Passwords don't match.");
      cfInput.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = "Changing\u2026";
    try {
      const ok = await this.plugin.changePassword(this.current || null, this.newPass);
      if (ok) {
        new import_obsidian.Notice("\u2705 Password changed.");
        this.close();
      } else {
        new import_obsidian.Notice("\u274C Failed \u2014 current password may be incorrect.");
        btn.disabled = false;
        btn.textContent = "Change password";
      }
    } catch (e) {
      console.error("Change password error:", e);
      new import_obsidian.Notice("\u274C Error: " + e.message);
      btn.disabled = false;
      btn.textContent = "Change password";
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ImportKeyModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.text = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "\u{1F4E5}", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Import .vault-key" });
    contentEl.createEl("p", {
      text: "Paste the contents of a .vault-key JSON file. This will overwrite the current key blob.",
      cls: "vault-cipher-subtitle"
    });
    const ta = contentEl.createEl("textarea", { cls: "vault-cipher-large-textarea" });
    ta.placeholder = '{"v":1,"salt":"\u2026","encryptedKey":"\u2026"}';
    ta.addEventListener("input", () => {
      this.text = ta.value.trim();
    });
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());
    const importBtn = buttonRow.createEl("button", { text: "Import", cls: "btn-primary mod-warning" });
    importBtn.addEventListener("click", async () => {
      if (!this.text) {
        new import_obsidian.Notice("Paste the .vault-key JSON first.");
        return;
      }
      try {
        JSON.parse(this.text);
      } catch (e) {
        new import_obsidian.Notice("Invalid JSON.");
        return;
      }
      this.close();
      new ConfirmModal(this.app, {
        title: "Overwrite .vault-key?",
        message: "This will replace the current vault key. Make sure you have a backup first.",
        confirmText: "Yes, overwrite",
        onConfirm: async () => {
          try {
            await this.plugin.writeKeyBlob(this.text);
            new import_obsidian.Notice("\u2705 .vault-key imported.");
          } catch (e) {
            new import_obsidian.Notice("\u274C Import failed: " + e.message);
          }
        }
      }).open();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmModal = class extends import_obsidian.Modal {
  constructor(app, { title, message, confirmText, onConfirm }) {
    super(app);
    this.title = title;
    this.message = message;
    this.confirmText = confirmText || "Confirm";
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "\u26A0\uFE0F", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: this.title });
    contentEl.createEl("p", { text: this.message, cls: "vault-cipher-subtitle" });
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());
    const confirmBtn = buttonRow.createEl("button", {
      text: this.confirmText,
      cls: "btn-primary mod-warning"
    });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/settings.js
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  enabled: false,
  keyBlobFile: ".vault-key",
  encryptedExtension: ".enc",
  excludedFolders: [],
  autoLockMinutes: 5
};
var VaultCipherSettingsTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Vault Cipher Settings" });
    const statusDiv = containerEl.createDiv({ cls: "vault-cipher-status" });
    const isUnlocked = this.plugin.sessionKey !== null;
    const isEnabled = this.plugin.settings.enabled;
    statusDiv.createEl("p", {
      text: isEnabled ? isUnlocked ? "\u{1F513} Vault is unlocked for this session." : "\u{1F512} Vault is locked. Notes are encrypted." : "\u26A0\uFE0F Encryption is not enabled for this vault."
    });
    if (isEnabled && isUnlocked) {
      new import_obsidian2.Setting(containerEl).setName("Lock vault").setDesc("Clear the session key from memory.").addButton((btn) => {
        btn.setButtonText("Lock now").onClick(() => {
          this.plugin.lockVault();
          new import_obsidian2.Notice("Vault locked.");
          this.display();
        });
      });
    }
    new import_obsidian2.Setting(containerEl).setName("Auto-lock after inactivity").setDesc("Automatically lock the vault after N minutes (0 = disabled).").addText((text) => {
      var _a;
      text.setPlaceholder("0").setValue(String((_a = this.plugin.settings.autoLockMinutes) != null ? _a : 0)).onChange(async (val) => {
        const mins = parseInt(val, 10);
        this.plugin.settings.autoLockMinutes = isNaN(mins) || mins < 0 ? 0 : mins;
        await this.plugin.saveSettings();
        this.plugin.resetAutoLockTimer();
      });
      text.inputEl.type = "number";
      text.inputEl.min = "0";
    });
    new import_obsidian2.Setting(containerEl).setName("Excluded folders").setDesc("Comma-separated folder paths to exclude from encryption.").addText((text) => {
      text.setPlaceholder("Templates, Attachments").setValue(this.plugin.settings.excludedFolders.join(", ")).onChange(async (val) => {
        this.plugin.settings.excludedFolders = val.split(",").map((s) => s.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("h3", { text: "Password & Key" });
    new import_obsidian2.Setting(containerEl).setName("Change vault password").setDesc("Re-wrap the vault key with a new password.").addButton((btn) => {
      btn.setButtonText("Change password").onClick(() => {
        new ChangePasswordModal(this.app, this.plugin).open();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Export .vault-key").setDesc("Copy the .vault-key contents to clipboard for backup.").addButton((btn) => {
      btn.setButtonText("Copy key blob").onClick(async () => {
        try {
          const blob = await this.plugin.readKeyBlob();
          if ((navigator == null ? void 0 : navigator.clipboard) && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(blob);
            new import_obsidian2.Notice("\u2705 .vault-key copied to clipboard. Store it safely.");
          } else {
            window.prompt("Copy the .vault-key JSON (CTRL+C):", blob);
          }
        } catch (e) {
          new import_obsidian2.Notice("Failed to read .vault-key: " + e.message);
        }
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Import .vault-key").setDesc("Paste a .vault-key JSON to overwrite current key (use with caution).").addButton((btn) => {
      btn.setButtonText("Import key").onClick(() => {
        new ImportKeyModal(this.app, this.plugin).open();
      });
    });
    containerEl.createEl("h3", { text: "Danger Zone" });
    if (isEnabled) {
      new import_obsidian2.Setting(containerEl).setName("Decrypt all notes and disable encryption").setDesc("Permanently decrypts all notes and removes the key blob.").addButton((btn) => {
        btn.setButtonText("Disable encryption").setClass("mod-warning").onClick(() => {
          if (!isUnlocked) {
            new import_obsidian2.Notice("Unlock the vault first.");
            return;
          }
          new ConfirmModal(this.app, {
            title: "Disable Vault Cipher?",
            message: "This will decrypt all your notes and delete the key blob. This cannot be undone.",
            confirmText: "Yes, decrypt everything",
            onConfirm: async () => {
              await this.plugin.disableEncryption();
              this.display();
            }
          }).open();
        });
      });
    }
    containerEl.createEl("h3", { text: "About" });
    containerEl.createEl("p", {
      text: "Vault Cipher encrypts your notes using Argon2id and ChaCha20-Poly1305. The vault key is stored in .vault-key at the vault root. Keep backups of that file.",
      cls: "vault-cipher-about"
    });
  }
};

// src/main.js
var KEY_BLOB_FILENAME = ".vault-key";
var CIPHER_MARKER = "vault-cipher:v1:";
var VaultCipherPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "sessionKey", null);
    __publicField(this, "_writingFiles", /* @__PURE__ */ new Set());
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VaultCipherSettingsTab(this.app, this));
    this.registerEvent(this.app.vault.on("create", (file) => this.maybeHideFile(file)));
    this.app.workspace.onLayoutReady(async () => {
      this.hideKeyBlobFromExplorer();
      await this.promptUnlock();
    });
    this.registerEvent(this.app.workspace.on("file-open", async (file) => {
      if (!file || !this.settings.enabled)
        return;
      await this.decryptFileIntoEditor(file);
      this.resetAutoLockTimer();
    }));
    this.registerEvent(this.app.workspace.on("editor-change", () => {
      if (this.sessionKey)
        this.resetAutoLockTimer();
    }));
    this.patchVaultModify();
    this.addCommand({
      id: "lock-vault",
      name: "Lock vault",
      callback: () => {
        this.lockVault();
        new import_obsidian3.Notice("\u{1F512} Vault locked.");
      }
    });
    this.addCommand({
      id: "unlock-vault",
      name: "Unlock vault",
      callback: () => this.promptUnlock()
    });
    this.addCommand({
      id: "encrypt-all-notes",
      name: "Encrypt all existing notes",
      callback: () => this.encryptAllNotes()
    });
    console.log("Vault Cipher loaded.");
  }
  onunload() {
    this.lockVault();
    this.clearAutoLockTimer();
    console.log("Vault Cipher unloaded \u2014 session key cleared.");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  lockVault() {
    if (this.sessionKey)
      this.sessionKey.fill(0);
    this.sessionKey = null;
    this.clearAutoLockTimer();
  }
  resetAutoLockTimer() {
    if (!this.settings.autoLockMinutes || this.settings.autoLockMinutes <= 0)
      return;
    this.clearAutoLockTimer();
    this._autoLockTimer = setTimeout(() => {
      this.lockVault();
      new import_obsidian3.Notice("\u{1F512} Vault Cipher: auto-locked after inactivity.");
    }, this.settings.autoLockMinutes * 60 * 1e3);
  }
  clearAutoLockTimer() {
    if (this._autoLockTimer) {
      clearTimeout(this._autoLockTimer);
      this._autoLockTimer = null;
    }
  }
  async waitForRemoteKey(ms = 3e3, interval = 300) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (await this.keyBlobExists())
        return true;
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }
  async promptUnlock() {
    if (this.sessionKey)
      return;
    const sawRemote = await this.waitForRemoteKey(1500, 250);
    const keyBlobExists = await this.keyBlobExists();
    if (!keyBlobExists && !sawRemote) {
      new SetupModal(this.app, this, async (password) => {
        await this.setupEncryption(password);
      }).open();
    } else {
      new UnlockModal(this.app, async (password) => {
        return await this.unlockWithPassword(password);
      }).open();
    }
  }
  async unlockWithPassword(password) {
    try {
      const blobJson = await this.readKeyBlob();
      this.sessionKey = await unlockKeyBlob(password, blobJson);
      return true;
    } catch (e) {
      return false;
    }
  }
  async setupEncryption(password) {
    const vaultKey = generateVaultKey();
    const blob = await createKeyBlob(password, vaultKey);
    await this.writeKeyBlob(blob);
    this.sessionKey = vaultKey;
    this.settings.enabled = true;
    await this.saveSettings();
    this.hideKeyBlobFromExplorer();
  }
  // Change password: re-wrap in-place using sessionKey (must be unlocked)
  async changePassword(currentPasswordOrNull, newPassword) {
    if (this.sessionKey) {
      const newBlob = await createKeyBlob(newPassword, this.sessionKey);
      await this.writeKeyBlob(newBlob);
      new import_obsidian3.Notice("\u2705 Password changed.");
      return true;
    }
    if (currentPasswordOrNull) {
      const ok = await this.unlockWithPassword(currentPasswordOrNull);
      if (!ok)
        return false;
      try {
        const newBlob = await createKeyBlob(newPassword, this.sessionKey);
        await this.writeKeyBlob(newBlob);
        new import_obsidian3.Notice("\u2705 Password changed.");
        return true;
      } finally {
      }
    }
    return false;
  }
  async keyBlobExists() {
    return this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME) instanceof import_obsidian3.TFile;
  }
  async readKeyBlob() {
    const file = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (!file)
      throw new Error("Key blob not found");
    return await this.app.vault.read(file);
  }
  async writeKeyBlob(content) {
    const existing = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    try {
      if (existing instanceof import_obsidian3.TFile) {
        const writeFn = this._originalModify || this.app.vault.modify.bind(this.app.vault);
        await writeFn(existing, content);
      } else {
        await this.app.vault.create(KEY_BLOB_FILENAME, content);
      }
    } catch (e) {
      try {
        const adapter = this.app.vault.adapter;
        if (adapter && adapter.write) {
          await adapter.write(KEY_BLOB_FILENAME, content);
        } else {
          throw e;
        }
      } catch (err) {
        console.error("Failed to write key blob:", err);
        throw err;
      }
    }
  }
  hideKeyBlobFromExplorer() {
    const styleId = "vault-cipher-hide-keyblob";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .nav-file[data-path="${KEY_BLOB_FILENAME}"],
        .nav-file-title[data-path="${KEY_BLOB_FILENAME}"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  maybeHideFile(file) {
    if (file.path === KEY_BLOB_FILENAME)
      this.hideKeyBlobFromExplorer();
  }
  isEncrypted(content) {
    return typeof content === "string" && content.startsWith(CIPHER_MARKER);
  }
  isExcluded(filePath) {
    if (filePath === KEY_BLOB_FILENAME)
      return true;
    return this.settings.excludedFolders.some(
      (folder) => filePath.startsWith(folder + "/") || filePath === folder
    );
  }
  async encrypt(plaintext) {
    if (!this.sessionKey)
      throw new Error("Vault is locked");
    const ciphertext = encryptNote(this.sessionKey, plaintext);
    return CIPHER_MARKER + ciphertext;
  }
  async decrypt(ciphertext) {
    if (!this.sessionKey)
      throw new Error("Vault is locked");
    const payload = ciphertext.slice(CIPHER_MARKER.length);
    return decryptNote(this.sessionKey, payload);
  }
  async decryptFileIntoEditor(file) {
    var _a;
    if (!(file instanceof import_obsidian3.TFile))
      return;
    if (file.extension !== "md")
      return;
    if (this.isExcluded(file.path))
      return;
    if (!this.sessionKey)
      return;
    const raw = await this.app.vault.read(file);
    if (!this.isEncrypted(raw)) {
      if (raw.trim().length > 0) {
        new import_obsidian3.Notice(
          `\u26A0\uFE0F Vault Cipher: "${file.name}" is not encrypted. Run "Encrypt all existing notes" to fix this.`,
          8e3
        );
      }
      return;
    }
    try {
      const plaintext = await this.decrypt(raw);
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile || activeFile.path !== file.path)
        return;
      const editor = (_a = this.app.workspace.activeEditor) == null ? void 0 : _a.editor;
      if (editor) {
        this._writingFiles.add(file.path);
        try {
          editor.setValue(plaintext);
        } finally {
          this._writingFiles.delete(file.path);
        }
      }
    } catch (e) {
      new import_obsidian3.Notice("Vault Cipher: failed to decrypt note \u2014 vault may be locked.");
      console.error("Vault Cipher decrypt error:", e);
    }
  }
  patchVaultModify() {
    const _originalModify = this.app.vault.modify.bind(this.app.vault);
    this._originalModify = _originalModify;
    this.app.vault.modify = async (file, data, options) => {
      if (this.settings.enabled && this.sessionKey && file instanceof import_obsidian3.TFile && file.extension === "md" && !this.isExcluded(file.path) && !this._writingFiles.has(file.path) && !this.isEncrypted(data)) {
        try {
          data = await this.encrypt(data);
        } catch (e) {
          console.error("Vault Cipher: failed to encrypt on save:", e);
          new import_obsidian3.Notice("\u26A0\uFE0F Vault Cipher: encryption failed \u2014 note NOT saved to prevent plaintext leak.");
          return;
        }
      }
      return _originalModify(file, data, options);
    };
    this.register(() => {
      this.app.vault.modify = _originalModify;
    });
  }
  async encryptAllNotes() {
    if (!this.sessionKey) {
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await this.app.vault.read(file);
      if (this.isEncrypted(content))
        continue;
      const encrypted = await this.encrypt(content);
      this._writingFiles.add(file.path);
      try {
        await this.app.vault.modify(file, encrypted);
      } finally {
        this._writingFiles.delete(file.path);
      }
      count++;
    }
    new import_obsidian3.Notice(`\u2705 Vault Cipher: encrypted ${count} notes.`);
  }
  async disableEncryption() {
    if (!this.sessionKey) {
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await this.app.vault.read(file);
      if (!this.isEncrypted(content))
        continue;
      const plaintext = await this.decrypt(content);
      this._writingFiles.add(file.path);
      try {
        await this.app.vault.modify(file, plaintext);
      } finally {
        this._writingFiles.delete(file.path);
      }
      count++;
    }
    const keyFile = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (keyFile)
      await this.app.vault.delete(keyFile);
    this.lockVault();
    this.settings.enabled = false;
    await this.saveSettings();
    new import_obsidian3.Notice(`\u2705 Vault Cipher disabled. ${count} notes decrypted.`);
  }
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/esm/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/
