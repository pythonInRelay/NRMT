let NRMTstyles = document.createElement("style");
NRMTstyles.innerHTML = `
.NRMTnode,
#NRMTtooltip {
    border-style: solid;
    border-width: 1px;
    border-radius: 5px;
    padding:1px;
    z-index: 1000;
}

.NRMTnode {
    margin: 3px;
    background-color: white;
    border-color: grey;
}

#NRMTtooltip {
    position: absolute;
    visibility: hidden;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
}
`
document.head.appendChild(NRMTstyles);

let userToNRMTnode = {}
,   userToTooltipInfo = {};

var NRMT_TOOLTIP_LEFT_OFFSET = 65
,   NRMT_TOOLTIP_TOP_OFFSET = 20;

let tooltip = document.createElement("div");
tooltip.id = "NRMTtooltip";
let tooltipNameHeader = document.createElement("h3");
tooltip.appendChild(tooltipNameHeader);
tooltip.appendChild(document.createElement("hr"));
let tooltipContributionsContainer = document.createElement("div");
tooltip.appendChild(tooltipContributionsContainer);
let siteTable = document.getElementById("siteTable");
siteTable.insertBefore(tooltip, siteTable.firstChild);

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function makeTooltip(username, strings) {
    let tooltip = document.createElement("div");

    let nameText = document.createElement("h3");
    nameText.appendChild(document.createTextNode(username));
    tooltip.appendChild(nameText);
    tooltip.appendChild(document.createElement("hr"));
    
    strings.forEach(text => {
        let textNode = document.createElement("h4");
        textNode.appendChild(document.createTextNode(text));
        tooltip.appendChild(textNode);
    });

    tooltip.className = "NRMTtooltip";
    return tooltip;
}

function makeNRMTnode(parsed) {
    let username = parsed["children"][0]["data"]["author"]
    ,   frequented = {};
    
    for (let i = 0; i < parsed["dist"]; i++) {
        let sub = parsed["children"][i]["data"]["subreddit"];
        if (sub in frequented) {
            frequented[sub]++;
        } else {
            frequented[sub] = 1;
        }
    }

    let sortable = [];
    for (key in frequented) {
        sortable.push([key, frequented[key]]);
    }
    sortable.sort(function(a, b) {
        return a[1] - b[1];
    });
    
    let mostFrequented = sortable[sortable.length - 1][0];

    let textNode = document.createElement("a");
    textNode.appendChild(document.createTextNode(mostFrequented));
    textNode.setAttribute("href", `https://old.reddit.com/r/${mostFrequented}`);
    textNode.setAttribute("target", "_blank");
    textNode.style.color = "black";

    let NRMTnode = document.createElement("span");
    NRMTnode.appendChild(textNode);
    NRMTnode.className = "NRMTnode";

    userToNRMTnode[username] = NRMTnode;

    userToTooltipInfo[username] = [];
    for (let i = sortable.length - 1; i >= 0; i--) {
        let sub = sortable[i][0];
        let contributions = sortable[i][1];
        userToTooltipInfo[username].push(`r/${sub}: ${contributions}`);
    }

}

function NRMTnode_in_tagline(tagline) {
    return tagline.getElementsByClassName("NRMTnode").length > 0;
}

function mainLoop() {
    let taglines = document.getElementsByClassName("tagline");
    for (let i = 0; i < taglines.length; i++) {
        if (!NRMTnode_in_tagline(taglines[i])) {
            let authorTag = taglines[i].getElementsByClassName("author")[0];
            if (authorTag != null) {
                let username = authorTag.innerHTML;
                if (username in userToNRMTnode) {
                    if (userToNRMTnode[username] != null) {
                        let n = userToNRMTnode[username].cloneNode(true);
                        n.onmouseenter = function() {
                            tooltip.style.visibility = "visible";
                            tooltip.style.left = n.offsetLeft + NRMT_TOOLTIP_LEFT_OFFSET + "px";
                            tooltip.style.top = n.offsetTop + NRMT_TOOLTIP_TOP_OFFSET + "px";
                            tooltipNameHeader.innerText = username;
                            tooltipContributionsContainer.innerHTML = "";
                            userToTooltipInfo[username].forEach(text => {
                                let p = document.createElement("p");
                                p.appendChild(document.createTextNode(text));
                                tooltipContributionsContainer.appendChild(p);
                            });
                        }
                        n.onmouseleave = function() {
                            tooltip.style.visibility = "hidden";
                        }
                        insertAfter(n, authorTag);
                    }
                } else {
                    userToNRMTnode[username] = null;
                    let request = new XMLHttpRequest();
                    let url = `https://old.reddit.com/user/${username}.json?limit=100`;
                    request.open("GET", url);
                    request.onreadystatechange = function() {
                        if (request.readyState == 4 && request.status == 200) {
                            let parsed = JSON.parse(request.responseText);
                            makeNRMTnode(parsed["data"]);
                        }
                    }
                    request.send();
                }   
            }
        }
    }
}

setInterval(mainLoop, 400);
console.log("NRMT ready");
