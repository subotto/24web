"use strict";

function tabname(el) {
    return el.id.substring(4);
}

function tabid(name) {
    return "tab_" + name;
}

function togglename(el) {
    return el.id.substring(7);
}

function toggleid(name) {
    return "toggle_" + name;
}

function remove_class(id, cl) {
    document.getElementById(id).classList.remove(cl);
}

function add_class(id, cl) {
    document.getElementById(id).classList.add(cl);
}

function updtoggle(what) {
    if(localStorage[what] === undefined) return;
    var val = localStorage[what];
    var tabs = document.getElementById(toggleid(what)).children;
    for(var t = 0; t < tabs.length; t++) {
        add_class(tabname(tabs[t]) + "_" + what, "hidden");
        remove_class(tabs[t].id, "active");
    }
    remove_class(val + "_" + what, "hidden");
    add_class(tabid(val), "active");
    if(window[what + '_callback'] !== undefined) {
        window[what + '_callback'](val);
    }
}

function loadtoggle(what) {
    updtoggle(what);
}

function toggle(element) {
    if(element.classList.contains("active")) return;
    var what = togglename(element.parentNode);
    localStorage[what] = tabname(element);
    updtoggle(what);
}

if(localStorage === undefined) {
    window.localStorage = new Array();
}
