/**
 * author: Andrej Kovac xkovac36@stud.fit.vutbr.cz // andrej.kovac.ggc@gmail.com
 * date: 2017-04-08
 * file: dom-inspector.js
 */
/***************************************************************************************************
 ************************************** GLOBAL CONSTANTS *******************************************
 **************************************************************************************************/
/* IDs */
const domPanelId = "cz.vutbr.fit.xkovac36.dom-panel";
const bodyDivId = "cz.vutbr.fit.xkovac36.main-panel";
const domListId = "cz.vutbr.fit.xkovac36.dom-list";
const contextMenuId = "cz.vutbr.fit.xkovac36.context-menu";

/* GUI string constants */
const editTextLabel = "Edit text";
const addAttrLabel = "Add attribute";
const addIdLabel = "Add ID";
const editIdLabel = "Edit ID";
const addClassLabel = "Add Class";
const editClassLabel = "Edit Class";
const editAttrNameLabel = "Edit attribute name";
const deleteAttrLabel = "Delete attribute";
const editAttrValueLabel = "Edit attribute value";
const textNodeLabel = "#text";

/* prefixed CSS constants to avoid duplicates */
const nodeClass = "cz.vutbr.fit.xkovac36.node";
const special = "cz.vutbr.fit.xkovac36.special";
const attribute = "cz.vutbr.fit.xkovac36.attribute";
const attributeValue = "cz.vutbr.fit.xkovac36.attributeValue";
const selected = "cz.vutbr.fit.xkovac36.selected";
const hidden = "cz.vutbr.fit.xkovac36.hidden";
const block = "cz.vutbr.fit.xkovac36.block";
const contextMenu = "cz.vutbr.fit.xkovac36.context-menu";
const contextMenuItem = "cz.vutbr.fit.xkovac36.context-menu-item";
const treeView = "cz.vutbr.fit.xkovac36.treeView";
const collapsibleListOpen = "cz.vutbr.fit.xkovac36.collapsibleListOpen";
const collapsibleListClosed = "cz.vutbr.fit.xkovac36.collapsibleListClosed";
const lastChildClass = "cz.vutbr.fit.xkovac36.lastChild";

/*
    Global Right Clicked Node
*/

var rightClickedElement;

/**
 * Enumerate nodetypes for easier code readability / avoid magic constants
 * Source: http://code.stephenmorley.org/javascript/dom-nodetype-constants/
 */
var NodeTypes = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
};

/***************************************************************************************************
 *************************************** MAIN BODY *************************************************
 **************************************************************************************************/


/**
 *  Class for storing DOM elements and utility functions for the GUI representation
 */
class TreeNode {

    constructor(parent, children, bodyElement, domElement, type) {
        this.parent = parent;
        this.children = children;
        this.bodyElement = bodyElement;
        this.domElement = domElement;
        this.type = type;
    }

    setList(elem) {
        this.ul = elem;
    }

    /**
     * Appends Element do the DOM Panel
     */
    appendToDom(elem) {
        //Special case when building rootNode
        if (this.parent == null) {
            domList.appendChild(elem);
        } else {
            if (this.parent.ul) {
                this.parent.ul.appendChild(elem);
            } else {
                this.parent.domElement.appendChild(elem);
            }
        }

    }

    /**
     * Returns the last child of bodyElement that is of the desired type
     * @return lastChild
     */
    bodyLastChild() {
        let lastChild = null;
        let children = null;
        if (this.bodyElement == document.body) {
            children = this.bodyElement.firstChild.childNodes;
        } else {
            children = this.bodyElement.childNodes;
        }

        if (children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                type = this.bodyElement.nodeType;
                if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE 
                    || type == NodeTypes.TEXT_NODE) {
                    
                    lastChild = children[i];
                }
            } 
        } else { 
            //Because Attributes are rendered before HTML tags an attribute can only be
            //last child if there is no HTML tag
            if (this.bodyElement.attributes && this.bodyElement.attributes.length > 0) {
                return this.bodyElement.attributes[this.bodyElement.attributes.length - 1];
            }
        }
        return lastChild;

    }

    findByBody(elem) {
        if (!elem) return null;

        if (this.bodyElement == elem) {
            return this;
        } else {
            for (let i = 0; i < this.children.length; ++i) {
                let result = this.children[i].findByBody(elem);
                if (result) {
                    return result;
                }
            }
            return null;
        }
    }

    setAttributeName(name) {
        let oldName = this.bodyElement.name;
        let parentNode = this.parent;
        let parentElem = this.parent.bodyElement;

        parentElem.setAttribute(name, this.bodyElement.value);
        parentElem.removeAttribute(oldName);
        this.bodyElement = this.parent.getAttributeByName(name);
        this.domElement.firstChild.textContent = name;
    }

    getAttributeByName(name) {
        let atts = this.bodyElement.attributes;
        if (atts && atts.length > 0) {
            for (let i = 0; i < atts.length; i++) {
                if (atts[i].nodeName == name) {
                    return atts[i];
                }
            }
        }
    }
}


/**
 * Main body of the program
 */
function inspector() {
    if (!document.getElementById(domPanelId) && !document.getElementById(bodyDivId)) {
        applyCss();
        repackSite();
        //Create The DOM Inspector table and add it to DOM panel
        domList = document.createElement("ul");
        domPanel.appendChild(domList);
        domList.id = domListId;
        domList.className = treeView;
        buildContextMenu(domPanel);
        //Build tree of nodes
        rootNode = new TreeNode(null, [], document.documentElement, null, NodeTypes.DOCUMENT_NODE);
        buildElementGUI(rootNode);
        buildTree(rootNode);
    }
}

/**
 * Add link to css file to the header
 *
 * @return void
 */
function applyCss() {
    var cssId = "cz.vutbr.fit.css";
    if (!document.getElementById(cssId)) {
        var head = document.getElementsByTagName("head")[0];
        var link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = "dom-inspector.css";
        head.appendChild(link);
    }
}

/**
 * Repackage the body content of the HTML page into the bodyDiv and the insepctor part into
 * the dom panel
 * 
 */
function repackSite() {
    domPanel = document.createElement("div");
    domPanel.id = domPanelId;

    var bodyElements = document.querySelectorAll("body > *");
    bodyDiv = document.body.cloneNode(true);
    bodyDiv.id = bodyDivId;
    document.body.innerText = "";
    document.body.appendChild(bodyDiv);
    bodyDiv.outerHTML = bodyDiv.outerHTML.replace(/body/g, "div");
    for (i = 0; i < bodyElements.length; i++) {
        var currentElement = bodyElements[i];
        bodyDiv.appendChild(currentElement);
    }
    document.body.appendChild(domPanel);

}

function buildContextMenu(body) {
	if (!body) {
		console.error("No Body element received.");
		return;
	}
	
	let contextDiv = document.createElement("div");
	contextDiv.id = contextMenuId;
	body.appendChild(contextDiv);
	let contextList = document.createElement("ul");
    contextDiv.appendChild(contextList);
    contextDiv.classList.add(contextMenu);
    let menuItem1 = document.createElement("li");
    contextList.appendChild(menuItem1);
    let span1 = document.createElement("span");
    menuItem1.appendChild(span1);
    span1.classList.add(contextMenuItem);
    span1.addEventListener("click",function(event) {
        firstLinkListener(event);
    });
    let menuItem2 = document.createElement("li");
    contextList.appendChild(menuItem2);
    let span2 = document.createElement("span");
    menuItem2.appendChild(span2);
    span2.classList.add(contextMenuItem);
    let menuItem3 = document.createElement("li");
    contextList.appendChild(menuItem3);
    let span3 = document.createElement("span");
    menuItem3.appendChild(span3);
    span3.classList.add(contextMenuItem);
}


/**
 * Recursive depth-first function to build out our own tree of TreeNode objects
 * 
 * @param currentNode 
 * @param
 * @return void
 */
function buildTree(currentNode) {
    if (currentNode.bodyElement === document.body) {
        buildTree2(currentNode, document.body.firstChild.childNodes);
        currentNode.domElement.classList.add(collapsibleListOpen);
        return
    }
    buildTree2(currentNode, currentNode.bodyElement.childNodes);

}

function buildTree2(currentNode, children) {

    for (let i = 0; i < children.length; i++) {
        //create node in the tree
        let newNode = new TreeNode(currentNode, [], children[i], null, children[i].nodeType);
        if (newNode.type == NodeTypes.ELEMENT_NODE || newNode.type == NodeTypes.DOCUMENT_NODE 
                || newNode.type == NodeTypes.TEXT_NODE) {
            buildElementGUI(newNode);
            currentNode.children.push(newNode);
            //Add attributes and values
            let atts = newNode.bodyElement.attributes;
            if (atts && atts.length > 0) {
                for (let i = 0; i < atts.length; i++) {
                    let att = atts[i];
                    let attrNode = new TreeNode(newNode, [], att, null, NodeTypes.ATTRIBUTE_NODE);
                    buildElementGUI(attrNode);
                }
            }
            //Recursive call
            if (nodeChildCount(newNode.bodyElement) > 0) {
                buildTree(newNode);
            }
        }
    }
}

/**
 * Function for handling HTML elements
 *
 * @param newNode Node created while building tree
 * @return boolean returns true if child nodes need to be further processed
 */
function buildElementGUI(newNode) {
    let li = document.createElement("li");
    newNode.appendToDom(li);
    newNode.domElement = li;
    
    if (newNode.type == NodeTypes.TEXT_NODE || newNode.type == NodeTypes.ELEMENT_NODE || newNode.type == NodeTypes.DOCUMENT_NODE) {
        var tag = document.createElement("span");
        li.appendChild(tag);
        tag.className = nodeClass;
        if (newNode.type == NodeTypes.TEXT_NODE) {
            tag.textContent = textNodeLabel;
        } else {
            tagName = newNode.bodyElement.tagName.toLowerCase();
            tag.textContent = tagName;
        }
        
        if (childrenCount(newNode.bodyElement) > 0) {
            var ul = document.createElement("ul");
            li.appendChild(ul);
            newNode.setList(ul);
            li.classList.add(collapsibleListOpen);
            li.addEventListener("click", function(event) {
                toggle(newNode);
                cancelEvent(event);
            });
        } else {
            newNode.setList(null);
        }
        
        newNode.bodyElement.addEventListener("click", function(event) {
            select(newNode);
            cancelEvent(event);
        });

        tag.addEventListener("click", function(event) {
            select(newNode);
            cancelEvent(event);
        });

        tag.addEventListener("contextmenu",function(event) {
            contextAction(event, newNode);
            cancelEvent(event);
        });
    } else if (newNode.type == NodeTypes.ATTRIBUTE_NODE) {
        li.classList.add(attribute);
        let attSpan = document.createElement("span");
        li.appendChild(attSpan);
        let att = newNode.bodyElement;
        attSpan.textContent = att.nodeName;
        attSpan.classList.add(attribute);
        attSpan.addEventListener("contextmenu",function(event) {
            contextAction(event, newNode);
            cancelEvent(event);
        });
        if (att.nodeValue && att.nodeValue.trim() != "") {
            let separator = document.createElement("span");
            li.appendChild(separator);
            separator.textContent = '=';
            separator.classList.add(special);
            let attValSpan = document.createElement("span");
            li.appendChild(attValSpan);
            attValSpan.textContent = att.nodeValue;
            attValSpan.classList.add(attributeValue);
            attValSpan.addEventListener("contextmenu",function(event) {
                contextAction(event, newNode);
                cancelEvent(event);
            });
        }
    }

    if (newNode.parent && newNode.bodyElement == newNode.parent.bodyLastChild()) {
        li.classList.add(lastChildClass);
    }
}

function contextAction(event, newNode) {
	event.preventDefault();
	console.log("Right Clicked");
    let menu = document.getElementById(contextMenuId);
    if (menu.classList.contains(block)) {
        toggleMenuOff();
    }
	toggleMenuOn(event, newNode);
}

function toggleMenuOn(event, newNode) {
	let menuPosition = getPosition(event);
	let menu = document.getElementById(contextMenuId);
	menu.classList.toggle(block);
	menu.style.top = menuPosition.y + "px";
	menu.style.left = menuPosition.x + "px";
    rightClickedElement = newNode;

    let firstLink = menu.firstChild.firstChild.firstChild;
    let secondLink = menu.firstChild.childNodes[1].firstChild;
    let thirdLink = menu.firstChild.lastChild.firstChild;
    switch (newNode.type) {
        case NodeTypes.TEXT_NODE:
            firstLink.textContent = editTextLabel;
            if (!secondLink.classList.contains(hidden)) {
                secondLink.classList.add(hidden);
            }
            if (!thirdLink.classList.contains(hidden)) {
                thirdLink.classList.add(hidden);
            }
        break;

        case NodeTypes.ELEMENT_NODE:
            if (newNode.bodyElement.id) {
                firstLink.textContent = editIdLabel;
            } else {
                firstLink.textContent = addIdLabel;
            }
            if (newNode.bodyElement.classList.length == 0) {
                secondLink.textContent = addClassLabel;
            } else {
                secondLink.textContent = editClassLabel;
            }
            if (secondLink.classList.contains(hidden)) {
                secondLink.classList.remove(hidden);
            }
            thirdLink.textContent = addAttrLabel;
            if (thirdLink.classList.contains(hidden)) {
                thirdLink.classList.remove(hidden);
            }
        break;

        case NodeTypes.ATTRIBUTE_NODE:
            firstLink.textContent = editAttrNameLabel;
            if (secondLink.classList.contains(hidden)) {
                secondLink.classList.remove(hidden);
            }
            secondLink.textContent = editAttrValueLabel;
            thirdLink.textContent = deleteAttrLabel;
            if (thirdLink.classList.contains(hidden)) {
                thirdLink.classList.remove(hidden);
            }
        break;
    }
}

function firstLinkListener(event) {
    switch(rightClickedElement.type) {
        case NodeTypes.TEXT_NODE:
            let text = prompt("Edit Text", rightClickedElement.bodyElement.textContent);
            if (text) {
                rightClickedElement.bodyElement.textContent = text;
            }
        break;

        case NodeTypes.ELEMENT_NODE:
            let val = prompt("Set new ID:", rightClickedElement.bodyElement.id); 
            if (val) {
                rightClickedElement.bodyElement.id = val;    
            }
        break;

        case NodeTypes.ATTRIBUTE_NODE:
            let name = prompt("Enter new attribute name:", rightClickedElement.bodyElement.name); 
            if (name) {
                rightClickedElement.setAttributeName(name);
            }
        break;
    }
}

function secondLinkListener(event) {
    switch(rightClickedElement.type) {
        case NodeTypes.ELEMENT_NODE:
            let classVal = prompt("Set new class(es):", rightClickedElement.bodyElement.class);
            if (classVal) {
                rightClickedElement.bodyElement.class = classVal;
            }
        break;

        case NodeTypes.ATTRIBUTE_NODE:
            let attrVal = prompt("Set new attribute value:", rightClickedElement.bodyElement.value);
            if (attrVal) {
                setAttributeValue(rightClickedElement,attrVal);
            }
        break;
    }
}


function setAttributeValue(node, name) {
    if (!node || !name) {
        console.error("Can't set attribute name, value or target node missing");
        return;
    }

    let parentElem = node.parent.bodyElement;
    parentElem.setAttribute(node.bodyElement.name,name);
}

function thirdLinkListener(event) {
    switch(rightClickedElement.type) {
        case NodeTypes.ELEMENT_NODE:
            let attrName = prompt("Set attribute name:", "");
            let attrVal = prompt("Set attribute value:", "");
            rightClickedElement.bodyElement.attributes
        break;

        case NodeTypes.ATTRIBUTE_NODE:

        break;
    }
}

function toggleMenuOff(newNode) {
	let menu = document.getElementById(contextMenuId);
	if (menu.classList.contains(block)) {
		menu.classList.remove(block);
	}

}

function toggle(elem) {
    elem.ul.classList.toggle(hidden);
    elem.domElement.classList.toggle(collapsibleListOpen);
    elem.domElement.classList.toggle(collapsibleListClosed);
}

function select(elem) {
    if (!elem) {
        console.error("Cannot select null element");
        return;
    }
    let parent = elem.parent;
    while (parent) {
        if (parent.domElement.classList.contains(collapsibleListClosed)) {
            toggle(parent);
        }
        parent = parent.parent;
    }
    let currentSelection = rootNode.findByBody(getSelectedElement());
    if (currentSelection) {
        currentSelection.bodyElement.classList.remove(selected);
        currentSelection.domElement.firstChild.classList.remove(selected);
    }
    elem.bodyElement.classList.add(selected);
    elem.domElement.firstChild.classList.add(selected);

    if (!isElementInViewport(elem.bodyElement)) {
    	elem.bodyElement.scrollIntoView();
    }
    
    if (!isElementInViewport(elem.domElement.firstChild)) {
    	elem.domElement.firstChild.scrollIntoView();
    }
}

function cancelEvent(event) {
    event.stopPropagation();
}

/**
 * Check if element is visible in the window
 * Source: https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
 *
 */
function isElementInViewport (el) {

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}


function childrenCount(elem) {
    return nodeChildCount(elem) + (elem.attributes ? elem.attributes.length : 0);
}

function nodeChildCount(elem) {
    var result = 0;

    //NullCheck
    if (!elem) return result;
    for (var i = 0; i < elem.childNodes.length; i++) {
        type = elem.childNodes[i].nodeType;
        if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE 
                || type == NodeTypes.TEXT_NODE) {
            result++;
        }
    }
    return result;
}

function getSelectedElement() {
    var selectedElem = document.getElementsByClassName(selected);
    if (selectedElem.length == 0) {
        return null;
    } else if (selectedElem.length == 2) {
        if (selectedElem[0].classList.contains("html")) {
            return selectedElem[1];
        } else {
            return selectedElem[0];
        }
    } else {
        console.error("Invalid state more than one element is selected");
    }
}

function getPosition(e) {
	var posx = 0;
	var posy = 0;

	if (!e) var e = window.event;


    if (e.clientX || e.clientY) {
		posx = e.clientX + domPanel.scrollLeft - domPanel.offsetLeft;
		posy = e.clientY + domPanel.scrollTop;
	}

	return {
		x: posx,
		y: posy
	}
}

//inspector();
window.onload = inspector;