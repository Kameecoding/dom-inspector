/**
 * author: Andrej Kovac xkovac36@stud.fit.vutbr.cz // andrej.kovac.ggc@gmail.com
 * date: 2017-04-08
 * file: dom-inspector.js
 */
/***************************************************************************************************
************************************** GLOBAL CONSTANTS ********************************************
***************************************************************************************************/
/* IDs */
const domPanelId = "cz.vutbr.fit.dom-panel";
const bodyDivId = "cz.vutbr.fit.main-panel";
const domListId = "cz.vutbr.fit.dom-list";

/* CSS and HTML constants */ 
const offset = 15;
const innerOffset = 9;
const start = "<";
const end = ">";
const singleEnd = "/>"
const endStart = "</"

/**
 * Enumerate nodetypes for easier code readability / avoid magic constants
 * Source: http://code.stephenmorley.org/javascript/dom-nodetype-constants/
 */
var NodeTypes = {
    ELEMENT_NODE                :  1,
    ATTRIBUTE_NODE              :  2,
    TEXT_NODE                   :  3,
    CDATA_SECTION_NODE          :  4,
    ENTITY_REFERENCE_NODE       :  5,
    ENTITY_NODE                 :  6,
    PROCESSING_INSTRUCTION_NODE :  7,
    COMMENT_NODE                :  8,
    DOCUMENT_NODE               :  9,
    DOCUMENT_TYPE_NODE          : 10,
    DOCUMENT_FRAGMENT_NODE      : 11,
    NOTATION_NODE               : 12
};

/***************************************************************************************************
*************************************** MAIN BODY **************************************************
***************************************************************************************************/


/**
 *  Class for storing DOM elements and utility functions for the GUI representation
 */
class TreeNode {
        
    constructor(parent, children, bodyElement, domElement) {
        this.parent      = parent;
        this.children    = children;
        this.bodyElement = bodyElement;
        this.domElement  = domElement;
        this.visible     = false;
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

    //Add Element to the Dom panel
    appendToDom(elem) {
        if (this.ul) {
            this.ul.appendChild(elem);
        } else {
            this.parent.domElement.appendChild(elem);    
        }
    }

    getParentOffset() {
    	return this.parent.domElement.style.paddingLeft;
    }
}


/**
 * Main body of the program
 */
function inspector() {
    if (!document.getElementById(domPanelId) && !document.getElementById(bodyDivId)) {
        applyCss();
        [domPanel, bodyDiv] = repackSite();
        //Create The DOM Inspector table and add it to DOM panel
        let domList = document.createElement('ul');
        domList.id = domListId;
        domPanel.appendChild(domList);

        //Build tree of nodes
        let rootNode = new TreeNode(null, [],bodyDiv, domList);
        buildTree(rootNode);
    }
}

/**
 * Add link to css file to the header
 *
 * @return void
 */
function applyCss() {
    var cssId = 'cz.vutbr.fit.css';
    if (!document.getElementById(cssId)) {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.id   = cssId;
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = 'dom-inspector.css';
        head.appendChild(link);
    }
}

/**
 * Repackage the body content of the HTML page into the bodyDiv and the insepctor part into
 * the dom panel
 * 
 * @return [domPanel, bodyDiv] div elements in the HTML
 */ 
function repackSite() {
    
    var domPanel = document.createElement("div");
    domPanel.id=domPanelId;

    var bodyElements = document.querySelectorAll( 'body > *' );
    var bodyDiv = document.body.cloneNode(true);
    bodyDiv.id=bodyDivId;
    document.body.innerText = "";
    document.body.appendChild(bodyDiv);
    bodyDiv.outerHTML = bodyDiv.outerHTML.replace(/body/g,"div");
    for (i=0;i<bodyElements.length; i++) {
        var currentElement = bodyElements[i];
        var type = currentElement.nodeType;
        //Only NodeTypes of Element,Text and Document
        if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.TEXT_NODE 
                || type == NodeTypes.DOCUMENT_NODE) {
            bodyDiv.appendChild(currentElement);
        }
    }
    document.body.appendChild(domPanel);

    return [domPanel,bodyDiv];
}

/**
 * Recursive depth-first function to build out our own tree of TreeNode objects
 * 
 * @param currentNode 
 * @param
 * @return void
 */
function buildTree(currentNode) {
    var children = currentNode.bodyElement.childNodes;
    for (let i = 0; i<children.length; i++) {
        //create node in the tree
        if (children[i].textContent == "\n") {
            continue;
        }
        let newNode = new TreeNode(currentNode, [], children[i], null);
        var type = newNode.bodyElement.nodeType;
        if (type == NodeTypes.ELEMENT_NODE || type == NodeTypes.DOCUMENT_NODE) {
        	let call = buildElement(newNode);
            //Recursive call
            if (call) {
                buildTree(newNode);
            }
        } else if (type == NodeTypes.TEXT_NODE) {
        	buildText(newNode);
        }
    }
}

/**
 * Function for handling HTML elements
 *
 * @param newNode Node created while building tree
 * @return boolean returns true if child nodes need to be further processed
 */
function buildElement(newNode) {
	let li = document.createElement('li');
    newNode.appendToDom(li);
    newNode.domElement = li;
    let span = document.createElement('span');
    li.appendChild(span);
    //create visual representation of the html code in the inspector
    span.textContent = "<" + newNode.bodyElement.tagName.toLowerCase();
    //Add attributes and values
    let atts = newNode.bodyElement.attributes;
    if (atts) {
        for (let i = 0; i < atts.length; i++){
            let att = atts[i];
            span.textContent += ' ';
            span.textContent += att.nodeName + '="' + att.nodeValue;
        }
    }
    if (newNode.bodyElement.childNodes.length == 1 
            && newNode.bodyElement.childNodes[0].nodeType == NodeTypes.TEXT_NODE) {
        span.textContent += '>' + newNode.bodyElement.childNodes[0].textContent;
        span.textContent += '</' + newNode.bodyElement.tagName.toLowerCase() + '>';
        return false;
    } else if (newNode.bodyElement.childNodes.length > 1) {
        let ul = document.createElement('ul');
        li.appendChild(ul);
        newNode.setCurrentList(ul);
    } else {
        newNode.setCurrentList(null);
    }

    return true;
    //newNode.domElement.style.paddingLeft = newNode.getParentOffset() + offset + 'px';
    //newNode.domElement.className = "toggle";  
}

/**
 * Function for handling Text content
 */
function buildText(newNode) {
    let li = document.createElement('li');
    newNode.appendToDom(li);
    newNode.domElement = li;
    let span = document.createElement('span');
    li.appendChild(span);
	span.textContent = newNode.bodyElement.textContent;
}


/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
function occurrences(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

//inspector();
window.onload=inspector;