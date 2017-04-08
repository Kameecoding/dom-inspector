/**
 * author: Andrej Kovac xkovac36@stud.fit.vutbr.cz // andrej.kovac.ggc@gmail.com
 * date: 2017-04-08
 * file: dom-inspector.js
 */
/***************************************************************************************************
************************************** GLOBAL CONSTANTS ********************************************
***************************************************************************************************/
const domPanelId = "cz.vutbr.fit.dom-panel";
const bodyDivId = "cz.vutbr.fit.body-panel";

/**
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
 *	Class for storing DOM elements and utility functions for the GUI representation
 */
class Node {
    	
   	constructor(bodyElement, parent, children) {
   		this.parent = parent;
   		this.children = children;
   		this.bodyElement = bodyElement;
   		this.visible = false;
   		this.domElement = null;
   	}  	

   	//Visibility setter
   	setVisible(visible) {
   		this.visible = visible;
   	}

   	//Visibility getter
   	isVisible() {
   		return this.visible;
   	}
}


/**
 * Main body of the program
 */
function inspector() {
	if (!document.getElementById(domPanelId) && !document.getElementById(bodyDivId)) {
		applyCss();
		[domPanel, bodyDiv] = repackSite();
		window.alert("Site Repacked");
		let rootNode = new Node(bodyDiv,null, []);
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

    var bodyDiv = document.createElement("div");
    bodyDiv.id=bodyDivId;

    var bodyElements = document.querySelectorAll( 'body > *' );
    document.body.appendChild(bodyDiv);
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
 * Recursive function to build out our own tree of Node objects
 *
 * @return void
 */
function buildTree(currentNode) {
	var children = currentNode.bodyElement.childNodes;
	for (let i = 0; i<children.length; i++) {
		let newNode = new Node(children[i],currentNode,[]);
		buildTree(newNode);
	}
}

window.onload=inspector;