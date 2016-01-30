pyscript.defmodule('hotkeys')
    .__new__(function(self) {
        self.scope = 'all';

        self._keyMap = {
            backspace: 8, tab: 9, clear: 12,
            enter: 13, 'return': 13,
            esc: 27, escape: 27, space: 32,
            left: 37, up: 38, right: 39, down: 40,
            del: 46, 'delete': 46,
            home: 36, end: 35,
            pageup: 33, pagedown: 34,
            ',': 188, '.': 190, '/': 191,
            '`': 192, '-': 189, '=': 187,
            ';': 186, '\'': 222,
            '[': 219, ']': 221, '\\': 220
        };
        self._downKeys=[];
        self._modifierMap = {
            16:'shiftKey',
            18:'altKey',
            17:'ctrlKey',
            91:'metaKey'
        };
        self._modifier = {//修饰键
            '⇧': 16, shift: 16,
            '⌥': 18, alt: 18, option: 18,
            '⌃': 17, ctrl: 17, control: 17,
            '⌘': 91, command: 91
        };
        self._mods = { 16: false, 18: false, 17: false, 91: false };
        self._handlers = {};
        for(var k=1;k<20;k++) {
            self._keyMap['f'+k] = 111+k;
        }
    })
    .__init__(function(self) {
        document.addEventListener('keydown', self.dispatchKeyEvent);
        document.addEventListener('keyup', self.clearModifiers);
    })
    .def({
        clearModifiers: function(event){
            var key = event.keyCode,
                i = self._downKeys.indexOf(key);

            if(i>=0) self._downKeys.splice(i,1);

            if(key === 93 || key === 224) key = 91;
            if(key in self._mods) {
                self._mods[key] = false;
            }
        },
        dispatchKeyEvent: function(self, event) {
            var key = event.keyCode;

            if(self._downKeys.indexOf(key)===-1) self._downKeys.push(key);

            if(key === 93 || key === 224) key = 91;
            if(key in self._mods) {
                self._mods[key] = true;
            }
            for(var e in self._mods)
                self._mods[e] = event[self._modifierMap[e]];

            if(!self.filter.call(this,event)) return;

            if (!(key in self._handlers)) return;

            for (var handler, i = 0; i < self._handlers[key].length; i++) {
                handler = self._handlers[key][i];
                handler.method(event, handler);
            }
        },
        getKeys: function(self, key) {
            var keys = key.replace(/\s/g, '').split(',');
            if ((keys[keys.length - 1]) === '') keys[keys.length - 2] += ',';
            return keys;
        },
        addKey: function(self, key, scope, method){
            var keys = self.getKeys(key);

            if (!method) {
                method = scope;
                scope = 'all';
            }

            for(var lastKey,i=0;i < keys.length; i++){
                lastKey = keys[i].split('-');
                lastKey = lastKey[lastKey.length-1];
                lastKey = self._keyMap[lastKey] || lastKey.charCodeAt(0);

                if (!(lastKey in self._handlers))
                    self._handlers[lastKey] = [];

                self._handlers[lastKey].push({shortcut: keys[i], scope: scope, method: method, key: keys[i]});
            }
        },
        filter: function(self, event){
            var tagName = (event.target).tagName;
            return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
        }
    });

pyscript.hotkeys = pyscript.module('hotkeys');
