
var common = util.common, AjaxGetData = util.AjaxGetData;
var GEOFilter = new function () {
    this.CreateGeoFilter = function (obj) {
        if (!(this instanceof GEOFilter.CreateGeoFilter)) {
            return new GEOFilter.CreateGeoFilter(obj || {});
        };
        var me = this, defaltConfig = {
            multipelSelect: false,
            header: [
                { "level": 1, "name": "WW" },
                { "level": 2, "name": "Area" },
                { "level": 3, "name": "Region" },
                { "level": 4, "name": "Sub Region" },
                { "level": 5, "name": "Subsidiary" },
                { "level": 6, "name": "Country" }
            ],
            confirm: function () { },
            cancel: function () { },
            AfterInit: function () { }
        };
        var config = me.config = $.extend(true, {}, defaltConfig, obj.config);
        me.showed = false;
        me.filterAnimating = false;
        me.itemsArray = [];
        me.itemsLevel = {};
        me.itemsInAttr = {};
        me.ele = common.cEle({
            ele: "div",
            classlist: ["GEOSelector", "filterSelector"],
            events: {
                "click": function (event) {
                    var $clickedItem = $(event.target), id = $clickedItem.attr("data-id");
                    if ($clickedItem.hasClass("areaItem")) {
                        if ($(searchInputBox).attr("type") == "open") {
                            $(searchInputBox).attr("type", "");
                            $(searchInput).val("");
                        }
                        var areaItem = me.itemsInAttr[$clickedItem.attr("data-id")];
                        if (areaItem.status == "all") {
                            if (config.multipelSelect) {
                                me.selector.delete(areaItem);
                            }
                        }
                        else if (areaItem.status == "half") {
                            if (config.multipelSelect) {
                                me.selector.add($clickedItem.attr("data-id"));
                            }
                            else {
                                me.selector.setSelectingList([]);
                                me.updateAll();
                                me.selector.add($clickedItem.attr("data-id"));
                            }
                        }
                        else {
                            if (config.multipelSelect) {
                                me.selector.add($clickedItem.attr("data-id"));
                            }
                            else {
                                me.selector.setSelectingList([]);
                                me.updateAll();
                                me.selector.add($clickedItem.attr("data-id"));
                            }
                        }
                    };
                }
            }
        });
        me.ele.appendChild(common.cEle({
            ele: "div",
            classlist: "GeoFilterArrow"
        }));
        var mainBoxEle = common.cEle({
            ele: "div",
            classlist: "filterMainBox"
        });
        var headerEle = common.cEle({
            ele: "div",
            classlist: "filterMainHeader"
        });
        var selectedBoxEle = common.cEle({
            ele: "div",
            classlist: "filterSelected"
        });
        var searchBoxEle = common.cEle({
            ele: "div",
            classlist: "GeoFilterSearchBox"
        });
        var searchIconBox = common.cEle({
            ele: "span",
            classlist: "GeoFilterSearchIconBox"
        })
        var searchIcon = common.cEle({
            ele: "i",
            classlist: "GeoFilterSearchIcon"
        });
        searchIconBox.appendChild(searchIcon);
        var searchInputBox = common.cEle({
            ele: "span",
            classlist: "GeoFilterSearchInputBox"
        });
        var searchInput = common.cEle({
            ele: "input",
            classlist: "GeoFilterSearchInput"
        });
        searchInputBox.appendChild(searchInput);
        searchBoxEle.appendChild(searchIconBox);
        searchBoxEle.appendChild(searchInputBox);
        headerEle.appendChild(selectedBoxEle);
        headerEle.appendChild(searchBoxEle);
        headerEle.appendChild(common.cEle({
            ele: "div",
            style: { "clear": "both" }
        }));
        var contentBoxEle = common.cEle({
            ele: "div",
            classlist: "filterContent"
        });
        var controlBoxEle = common.cEle({
            ele: "div",
            classlist: "geoFilterControlBox"
        });
        controlBoxEle.appendChild(common.cEle({
            ele: "div",
            classlist: "geoFilterSelect geoControlItem",
            text: "Select",
            events: {
                "click": function (event) {
                    me.selector.setSelectedList(me.selector.getSelectingList());
                    me.display(false);
                    config.confirm(me);
                }
            }
        }));
        controlBoxEle.appendChild(common.cEle({
            ele: "div",
            classlist: "geoFilterSelect geoControlItem",
            text: "Cancel",
            events: {
                "click": function (event) {
                    me.display(false);
                    if ($(searchInputBox).attr("type") == "open") {
                        $(searchInputBox).attr("type", "");
                        $(searchInput).val("");
                    }
                    config.cancel(me);
                }
            }
        }));
        mainBoxEle.appendChild(headerEle);
        mainBoxEle.appendChild(contentBoxEle);
        mainBoxEle.appendChild(controlBoxEle);
        me.ele.appendChild(mainBoxEle);
        me.regionBox = {
            regionBoxList: [],
            regionBoxLevel: 0,
            running: false,    //searching or updating
            afterRunning: [],
            update: function (geoObj) {
                if (me.regionBox.running) me.regionBox.afterRunning.push(function () { me.regionBox.update(geoObj); });
                me.regionBox.running = true;
                var clickedItem = geoObj;
                for (var i = 0; i < me.regionBox.regionBoxList.length; i++) {
                    if (i <= geoObj.level) {
                        me.regionBox.regionBoxList[i].ele.style.display = "block";
                    }
                    else {
                        me.regionBox.regionBoxList[i].ele.style.display = "none";
                    }
                }
                updateParent(geoObj);
                function updateParent(geoObj) {
                    if (geoObj.ParentGEOKey) {
                        var obj = me.itemsInAttr[geoObj.ParentGEOKey], Level = obj["Level"];
                        me.regionBox.regionBoxList[Level].update(obj, clickedItem);
                        if (obj.ParentGEOKey) {
                            updateParent(obj);
                        }
                    }
                }
                if (geoObj.level < me.regionBox.regionBoxList.length) {
                    me.regionBox.regionBoxList[Number(geoObj.level)].update(geoObj, clickedItem);
                }
                me.regionBox.running = false;
                for (var k = 0; k < me.regionBox.afterRunning.length; k++) {
                    typeof me.regionBox.afterRunning[k] == "function" && me.regionBox.afterRunning[k]();
                }
            },
            updateSearch: function (geoListAll) {
                if (me.regionBox.running) me.regionBox.afterRunning[0] = function () { me.regionBox.update(geoObj); };
                me.regionBox.running = true;
                //templeate::geoListAll:{"1":[{wwItem}],"2":[{AreaItem},{AreaItem}],"3":[{regionItem},{regionItem}]}
                for (var i = 1; i < me.regionBox.regionBoxList.length; i++) {
                    console.log("updateSearch: " + i);
                    console.log(geoListAll[i + 1]);
                    me.regionBox.regionBoxList[i].ele.style.display = "block";
                    me.regionBox.regionBoxList[i].updateByGeoList(geoListAll[i + 1]);
                }
                me.regionBox.running = false;
                for (var k = 0; k < me.regionBox.afterRunning.length; k++) {
                    console.log("after running");
                    typeof me.regionBox.afterRunning[k] == "function" && me.regionBox.afterRunning[k]();
                }
            },
            init: function () {
                for (var i = 0; i < config.header.length; i++) {
                    var box = new me.regionBox.CreateRegionBox(config.header[i]);
                    me.regionBox.regionBoxList.push(box);
                    contentBoxEle.appendChild(box.ele);
                }
            },
            CreateRegionBox: function (levelobj) {
                //templeate::levelobj:{ "level": 2, "name": "Area" }
                if (!(this instanceof me.regionBox.CreateRegionBox)) {
                    return new this.CreateRegionBox(level || { "level": 1, "name": "WW" });
                };
                //level = typeof level != "object" ? level : level.level;
                this.parentGeoObj = null;
                this.showed = false;
                this.level = levelobj.level;
                this.itemList = [];
                this.levelName = levelobj.name;
                this.ele = common.cEle({
                    ele: "div",
                    classlist: "regionClass regionLevel" + levelobj.level,
                    attr: {
                        "data-name": levelobj.name,
                        "data-level": levelobj.level
                    }
                });
                var title = common.cEle({
                    ele: "div",
                    classlist: "regionTitleClass"
                });
                this.ele.appendChild(title);

                title.appendChild(common.cEle({
                    ele: "span",
                    classlist: "regionTitleClassText",
                    text: levelobj.name + " :"
                }));
                this.contentEle = common.cEle({
                    ele: "div",
                    classlist: "regionBodyClass"
                    //text: levelobj.name
                });
                this.ele.appendChild(this.contentEle);
                this.update = function (obj, clickedItem) {
                    for (var j = 0; j < this.itemList.length; j++) {
                        var jtm = this.itemList[j];
                        if (jtm.GeoKey == clickedItem.GeoKey) continue;
                        jtm.viewFn(false);
                    };
                    for (var i = 0; i < obj.children.length; i++) {
                        var item = obj.children[i];
                        var ele = item.viewFn(true);
                        ele && ele.nodeType == 1 && this.contentEle.appendChild(ele);
                        this.itemList.push(item);
                    };
                };
                this.updateByGeoList = function (geoItemsList) {
                    for (var j = 0; j < this.itemList.length; j++) {
                        var jtm = this.itemList[j];
                        jtm.viewFn(false);
                    };
                    if (geoItemsList.length) {
                        for (var i = 0; i < geoItemsList.length; i++) {
                            var item = geoItemsList[i];
                            var ele = item.viewFn(true);
                            ele && ele.nodeType == 1 && this.contentEle.appendChild(ele);
                            this.itemList.push(item);
                        };
                    }
                }
                if (levelobj.level == 1) {
                    this.contentEle.appendChild(me.itemsInAttr["1"].viewFn(true));
                    //this.itemList.push(me.itemsInAttr["1"]);
                }
                return this;
            }
        };
        me.selector = new function () {
            var selectingList = [], selectedList = [];
            function updateSelectedBox() {
                $(selectedBoxEle).empty();
                for (var i = 0; i < selectingList.length; i++) {
                    var elm = common.cEle({
                        ele: "div",
                        classlist: "areaSelectItem",
                        text: selectingList[i].name
                    });
                    if (config.multipelSelect) {
                        elm.appendChild(common.cEle({
                            ele: "img",
                            classlist: "areaItemAllSeletedIcon",
                            attr: {
                                "src": "images/icons/delect.png",
                                "data-id": selectingList[i]["id"],
                            },
                            events: {
                                "click": function () {
                                    var id = $(this).attr("data-id");
                                    me.selector.delete(me.itemsInAttr[id]);
                                }
                            }
                        }));
                    }
                    selectedBoxEle.appendChild(elm);
                }
            };
            function CreateSelectedBoxItem(obj) {
                var ele = common.cEle({
                    ele: "div",
                    classlist: "areaSelectItem " + obj.id,
                    text: obj.name,
                    attr: {
                        "data-name": obj.name,
                        "data-id": obj.id
                    }
                });
                ele.appendChild(common.cEle({
                    ele: "img",
                    classlist: "areaItemAllSeletedIcon " + obj.id,
                    attr: {
                        "src": "images/icons/delect.png",
                        "data-id": obj.id,
                    },
                    events: {
                        "click": function () {
                            me.selector.delete(obj);
                        }
                    }
                }));
            }
            this.add = function (obj) {
                var target = typeof obj == "object" ? obj : me.itemsInAttr[obj];
                if (selectingList.filter(function (item) { return item.id == target.id }).length == 0) {
                    selectingList.push(target);
                    target.changeStatus("all");
                    me.regionBox.update(target);
                    updateSelectedBox();
                }
                else {
                    console.log("GEO Filter list error : Try to add an item which has already selected");
                }
            };
            this.delete = function (obj) {
                var target = typeof obj == "object" ? obj : me.itemsInAttr[obj];
                selectingList = selectingList.filter(function (item) {
                    return item.id != target.id;
                });
                target.changeStatus("off");
            };
            this.getSelectedList = function () {
                return selectedList;
            };
            this.setSelectedList = function (arr) {
                selectedList = arr;
            };
            this.getSelectingList = function () {
                return selectingList;
            }
            this.setSelectingList = function (arr) {
                selectingList = [];
                for (var i = 0; i < arr.length; i++) {
                    var item = arr[i];
                    if (typeof item == "object") {
                        this.add(item);
                    }
                    else {
                        this.add({ "id": item });
                    };
                };
                me.updateAll();
            }
            this.confirm = function () {
                selectedList = selectingList;
            }
        }

        function customData() {
            for (var i = 0, iLen = me.itemsArray.length; i < iLen; i++) {
                var obj = me.itemsArray[i];
                GEOFilter.createGeoItem(obj, me);
                me.itemsInAttr[obj.id] = obj;
                if (!me.itemsLevel[obj.Level]) me.itemsLevel[obj.Level] = [];
                me.itemsLevel[obj.Level].push(obj);
            };
            for (var j = 0, jLen = me.itemsArray.length; j < jLen; j++) {
                var obj = me.itemsArray[j];
                if (obj.parentId) {
                    me.itemsInAttr[obj["parentId"]]["children"].push(obj);
                }
            }
        };
        function initDataToGeoObj() {

        };
        function getUrlParams() {

        };
        function initSelectedList() {
            //TODO:parse url params
            if (true) {

            }
            if (me.selector.getSelectedList().length == 0) {
                me.selector.add(1);
                me.selector.setSelectedList(me.selector.getSelectingList());
            }
        };
        if (obj && Array.isArray(obj)) {
            this.data = obj;
            init(this.data);
        }
        else {
            var promise = GEOFilter.getAreaMap(obj);
            promise.then(function (resolve) {
                me.itemsArray = JSON.parse(resolve);
                init();
            }, function () {
                console.log("get geo map data faild !");
                me.itemsArray = FY17GeoData;
                init();
            })
        };

        function init() {
            customData();
            getUrlParams();
            me.regionBox.init();
            initSelectedList();
            $(me.ele).bind("transitionend webkitTransitionEnd msTransitionEnd oTransitionEnd", function () {
                me.filterAnimating = false;
            });
            $(searchIconBox).bind("click", function () {
                if ($(searchInputBox).attr("type") != "open") {
                    $(searchInputBox).attr("type", "open");
                    $(searchInput).focus();
                }
                else {
                    $(searchInputBox).attr("type", "");
                }
            });
            $(searchInput).bind("keyup", function (event) {
                me.search($(this).val());
            })
            $(document).click(function (event) {
                if (!$(event.target).closest(".GEOSelector").length && !$(event.target).closest(".filterGeoInputDiv").length) {
                    me.display(false);
                }
            });
            window.onkeydown = function (event) {
                if (me.showed) {
                    if ($(searchInputBox).attr("type") != "open") {
                        $(searchInputBox).attr("type", "open");
                        $(searchInput).focus();
                    }
                }
            }
            me.config.AfterInit();
        }
    },

    this.CreateGeoFilter.prototype.updateAll = function () {
        for (var i = 0; i < this.itemsArray.length; i++) {
            var obj = this.itemsArray[i];
            obj.changeStatus("off");
        };
        if (this.selector.getSelectedList() > 0) {
            for (var j = 0; j < this.selector.getSelectedList() ; j++) {
                this.selector.getSelectedList()[j].changeStatus("all");
            }
        }
    };
    this.CreateGeoFilter.prototype.search = function (query) {
        var me = this, matchedItems = {}; //matchedItems:{"1":[{wwItem}],"2":[{AreaItem},{AreaItem}],"3":[{regionItem},{regionItem}]}
        for (var i = 0; i < me.config.header.length; i++) {
            var headerItem = me.config.header[i];
            me.itemsLevel[headerItem.level]
            matchedItems[headerItem.level] = me.itemsLevel[headerItem.level].filter(function (item, i, a) {
                var reg = new RegExp(query, "ig");
                return !!item.Name.match(reg);
            })
        }
        me.regionBox.updateSearch(matchedItems);
    };
    this.CreateGeoFilter.prototype.destory = function () {

    };
    this.CreateGeoFilter.prototype.show = function () {
        this.showed = true;
        this.filterAnimating = true;
        this.ele.style.maxHeight = "700px";
    };
    this.CreateGeoFilter.prototype.hide = function () {
        this.ele.style.maxHeight = "0px";
        this.filterAnimating = true;
        this.showed = false;
        this.config.cancel(this);
    };
    this.CreateGeoFilter.prototype.display = function (toShow) {
        if (typeof toShow != "undefined") {
            toShow ? this.show() : this.hide();
        }
        else {
            if (!this.showed) {
                this.show();
            }
            else {
                this.hide();
            }
        }
        return this.showed;
    }
    this.createGeoItem = function (obj, menu) {
        try {
            obj.hasOwnProperty("Name") && (obj.name = obj.Name = obj.Name);
            obj.hasOwnProperty("GeoKey") && (obj.id = obj.GEOKey = obj.GeoKey);
            obj.hasOwnProperty("Level") && (obj.level = obj.Level = obj.Level);
            obj.hasOwnProperty("ParentGEOKey") ? (obj.parentId = obj.parentGEOKey = obj.ParentGEOKey) : (obj.parentId = obj.parentGEOKey = null);
            obj.status = null,
            obj.showed = false,
            obj.viewObj = null,
            obj.children = [],
            obj.selectedChildren = [],
            obj.filter = menu;
            obj.viewFn = function (show, parentId) {
                var elm = null;
                if (show) {
                    if (obj.showed)
                        return null;
                    var itemClass = "";
                    switch (this.status) {
                        case "all":
                            itemClass = "areaItem areaItemAllFocus " + obj.id;
                            break;
                        case "half":
                            itemClass = "areaItem areaItemHalfFocus " + obj.id;
                            break;
                        default:
                            itemClass = "areaItem " + obj.id;
                            break;
                    }
                    //var curItem = this;
                    elm = common.cEle({
                        ele: "div",
                        classlist: itemClass,
                        text: this.name,
                        attr: {
                            "data-id": obj.id
                        }
                    });
                    elm.appendChild(common.cEle({
                        ele: "img",
                        classlist: "areaItemAllFocusIcon",
                        attr: {
                            src: "images/icons/select.png"
                        }
                    }));
                    //var obj = $("<div>", {
                    //    "class": itemClass,
                    //    "text": this.name,
                    //    "click": function () {
                    //        if (curItem.id == "1") {
                    //            return; //TODO:  for test version!! need delete;
                    //        }
                    //        showNotice(true);
                    //        var pItem = curItem;
                    //        if (curItem.level == "1") {
                    //            switch (pItem.status) {
                    //                case "all":
                    //                    control.filterSelector.selectedListControl.delete(pItem);
                    //                    break;
                    //                case "half":
                    //                    control.filterSelector.selectedListControl.add(pItem);
                    //                    break;
                    //                default:
                    //                    control.filterSelector.selectedListControl.add(pItem);
                    //                    break;
                    //            }
                    //            control.filterSelector.showChildFilter(pItem);
                    //        }
                    //        else if (curItem.level == "2") {
                    //            switch (pItem.status) {
                    //                case "all":
                    //                    control.filterSelector.selectedListControl.delete(pItem);
                    //                    break;
                    //                default:
                    //                    control.filterSelector.selectedListControl.add(pItem);
                    //                    break;
                    //            }
                    //        }
                    //        event.stopPropagation();
                    //    }
                    //});
                    //obj.append("<img src='images/icons/select.png' class='areaItemAllFocusIcon' />");
                    //obj.appendTo(parentId);
                    obj.showed = true;
                    obj.viewObj = $(elm);
                }
                else {
                    if (!obj.showed)
                        return;
                    obj.viewObj && obj.viewObj.remove();
                    obj.showed = false;
                    obj.viewObj = null;
                }
                return elm;
            };
            obj.changeStatus = function (val) {
                switch (val) {
                    case "all":
                        var defaultClass = "areaItem areaItemAllFocus " + this.id;
                        this.status = val;
                        if (this.showed)
                            this.viewObj.hasClass("areaItemAllFocus") ? "" : this.viewObj.removeClass(), this.viewObj.addClass(defaultClass);
                        if (this.parentId) {
                            this.filter.itemsInAttr[this.parentId].changeStatus("half");
                        };
                        break;
                    case "half":
                        var defaultClass = "areaItem areaItemHalfFocus " + this.id;
                        //if (this.level == "1") {
                        this.status = val;
                        if (this.showed)
                            this.viewObj.hasClass("areaItemHalfFocus") ? "" : this.viewObj.removeClass(), this.viewObj.addClass(defaultClass);
                        if (this.parentId)
                            this.filter.itemsInAttr[this.parentId].changeStatus("half");
                        //};
                        break;
                    default:
                        var defaultClass = "areaItem " + this.id;
                        this.status = val;
                        if (this.showed)
                            this.viewObj.removeClass(), this.viewObj.addClass(defaultClass);
                        break;
                }
            };
        } catch (e) {
            console.log("Create geo Item error :" + e.stack);
        }
    },
    this.getAreaMap = function (obj) {
        var url = obj && obj.url ? obj.url : "DXGetAreaCountryMap.srv?action=GetFY17AreaMap";
        return AjaxGetData.getData(url, null, {}, false);
    }
}
