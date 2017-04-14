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

/* String constants */
const editTextLabel = "Edit text";
const addAttrLabel = "Add attribute (id and class are attributes too)";
const editAttrNameLabel = "Edit name";
const deleteAttrLabel = "Delete attribute";
const editAttrValueLabel = "Edit attribute value";


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

    constructor(parent, children, bodyElement, domElement) {
        this.parent = parent;
        this.children = children;
        this.bodyElement = bodyElement;
        this.domElement = domElement;
        this.visible = false;
    }

    //Visibility setter
    setVisible(visible) {
        this.visible = visible;
    }

    //Visibility getter
    isVisible() {
        return this.visible;
    }

    setCurrentList(elem) {
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

        for (let i = 0; i < children.length; i++) {
            type = this.bodyElement.nodeType;
            if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE || type == NodeTypes.TEXT_NODE) {
                lastChild = children[i];
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
        domList.className = "treeView";
        buildContextMenu();
        //Build tree of nodes
        rootNode = new TreeNode(null, [], document.documentElement, null);
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
    contextDiv.classList.add("context-menu");
    let menuItem1 = document.createElement("li");
    contextList.appendChild(menuItem1);
    let span = document.createElement("span");
    let menu_1 = document.createElement("li");
    contextList.appendChild(menu_1);
    let span_1 = document.createElement("span");
    menu_1.appendChild(span_1);
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
        currentNode.domElement.classList.add("collapsibleListOpen");
        return
    }
    buildTree2(currentNode, currentNode.bodyElement.childNodes);

}

function buildTree2(currentNode, children) {

    for (let i = 0; i < children.length; i++) {
        //create node in the tree
        let newNode = new TreeNode(currentNode, [], children[i], null);
        var type = newNode.bodyElement.nodeType;
        if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE || type == NodeTypes.TEXT_NODE) {
            buildElementGUI(newNode);
            currentNode.children.push(newNode);
            //Recursive call
            if (childrenCount(newNode.bodyElement) > 0) {
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

    var type = newNode.bodyElement.nodeType;
    if (type == NodeTypes.TEXT_NODE) {
        var tag = document.createElement("span");
        tag.textContent = "#text";
        tag.className = "html";
        li.appendChild(tag);
    } else if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE) {
        var tag = document.createElement("span");
        tagName = newNode.bodyElement.tagName.toLowerCase();
        tag.textContent = tagName;
        tag.className = "html";

        li.appendChild(tag);
        let hasChildren = false;
        //Add attributes and values
        let atts = newNode.bodyElement.attributes;

        if ((atts && atts.length > 0) || childrenCount(newNode.bodyElement) > 0) {
            hasChildren = true;
            var ul = document.createElement("ul");
            li.appendChild(ul);
            newNode.setCurrentList(ul);
        } else {
            newNode.setCurrentList(null);
        }

        if (atts && atts.length > 0) {
            for (let i = 0; i < atts.length; i++) {
                let att = atts[i];
                let attrib = document.createElement("li");
                ul.appendChild(attrib);
                attrib.classList.add("attribute");

                let attSpan = document.createElement("span");
                attrib.appendChild(attSpan);
                attSpan.textContent = att.nodeName + '=';
                attSpan.className = "attribute";

                if (att.nodeValue && att.nodeValue.trim() != "") {
                    let attValSpan = document.createElement("span");
                    attrib.appendChild(attValSpan);
                    attValSpan.textContent = att.nodeValue;
                    attValSpan.classList.add("attributeValue");
                }

                if (i == atts.length - 1 && childrenCount(newNode.bodyElement) == 0) {
                    attrib.classList.add("lastChild");
                }
            }
        }

        if (hasChildren) {
            li.classList.add("collapsibleListOpen");
            li.addEventListener("click", function(event) {
                toggle(newNode);
                cancelEvent(event);
            });

            tag.addEventListener("contextmenu",function(event) {
		    	let menuPosition = getPosition(e);
				let menuPositionX = menuPosition.x + "px";
				let menuPositionY = menuPosition.y + "px";

				menu.style.left = menuPositionX;
				menu.style.top = menuPositionY;
				menu.classList.toggle("block");
		    	cancelEvent(event);
		    });
        }
    }

    if (newNode.parent && newNode.bodyElement == newNode.parent.bodyLastChild()) {
        li.classList.add("lastChild");
    }

    tag.addEventListener("click", function(event) {
        select(newNode);
        cancelEvent(event);
    });
    newNode.bodyElement.addEventListener("click", function(event) {
        select(newNode);
        cancelEvent(event);
    });

}

function toggle(elem) {
    elem.ul.classList.toggle('hidden');
    elem.domElement.classList.toggle('collapsibleListOpen');
    elem.domElement.classList.toggle('collapsibleListClosed');
}

function select(elem) {
    let currentSelection = rootNode.findByBody(getSelectedElement());
    if (currentSelection) {
        currentSelection.bodyElement.classList.remove('selected');
        currentSelection.domElement.firstChild.classList.remove('selected');
    }
    elem.bodyElement.classList.add('selected');
    elem.domElement.firstChild.classList.add('selected');

    elem.bodyElement.scrollIntoView();
    elem.domElement.firstChild.scrollIntoView();
    //window.alert(rootNode.bodyElement.tagName);
}

function cancelEvent(event) {
    event.stopPropagation();
}



function childrenCount(elem) {
    var result = 0;

    //NullCheck
    if (!elem) return result;
    for (var i = 0; i < elem.childNodes.length; i++) {
        type = elem.childNodes[i].nodeType;
        if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE || type == NodeTypes.TEXT_NODE) {
            result++;
        }
    }
    return result;
}

function getSelectedElement() {
    var selected = document.getElementsByClassName('selected');
    if (selected.length == 0) {
        return null;
    } else if (selected.length == 2) {
        if (selected[0].classList.contains('html')) {
            return selected[1];
        } else {
            return selected[0];
        }
    } else {
        console.error("Invalid state more than one element is selected");
    }
}

function getPosition(e) {
	var posx = 0;
	var posy = 0;

	if (!e) var e = window.event;

	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return {
		x: posx,
		y: posy
	}
}

//inspector();
window.onload = inspector;