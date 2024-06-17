var problemModels = null;
let url = window.location.href;

if (url.startsWith("https://atcoder.jp/contests/") && url.includes("/tasks/")) {
    addRating();
    addBookmark();
}

async function addRating(){
    console.log("Adding rating");
    
    let nurl = url.replace("https://atcoder.jp/contests/", "");
    const contest = nurl.split("/")[0];
    const task = nurl.split("/")[2];

    await $.get("https://kenkoooo.com/atcoder/resources/problem-models.json", function(data) {
        problemModels = data;
    });

    // Select DOM element to append rating
    let content = $("#main-container > div.row > div.col-sm-12")[1];
    let data = document.createElement("div");
    data.style.display = "flex";
    data.style.alignItems = "center";
    data.innerHTML = "<p>Problem Rating:&nbsp;</p>";

    let ratingDOM = document.createElement("p");
    ratingDOM.innerHTML = `${Math.max(Math.floor(problemModels[task].difficulty/100)*100,0)}`;
    ratingDOM.style.color = ratingBackgroundColor(problemModels[task].difficulty);
    data.appendChild(ratingDOM);

    content.insertBefore(data, content.children[5]);
}

function addBookmark(){
    let nurl = url.replace("https://atcoder.jp/contests/", "");
    const contest = nurl.split("/")[0];
    const task = nurl.split("/")[2];

    let bookmark = document.createElement("div");
    bookmark.innerHTML = "Bookmark";
    bookmark.classList.add("btn", "btn-default", "btn-sm");

    chrome.storage.sync.get("bookmarks", function(data) {
        let bookmarks = data.bookmarks;
        if (bookmarks === undefined) {
            bookmarks = [];
        }
        let bookmarked = false;
        for (let i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i].contest === contest && bookmarks[i].task === task) {
                bookmarked = true;
                break;
            }
        }
        if (bookmarked) {
            bookmark.innerHTML = "Bookmarked";
            bookmark.style.backgroundColor = "#4CAF50";
            bookmark.style.color = "#fff";
        } else {
            bookmark.innerHTML = "Bookmark";
            bookmark.style.backgroundColor = "#ffffff";
            bookmark.style.color = "#333";
        }
    });

    let content = document.getElementById("task-lang-btn").previousElementSibling;
    console.log(content)
    content.appendChild(bookmark);

    bookmark.addEventListener("click", function() {
        chrome.storage.sync.get("bookmarks", function(data) {
            let bookmarks = data.bookmarks;
            if (bookmarks === undefined) {
                bookmarks = [];
            }
            let bookmarked = false;
            let index = -1;
            for (let i = 0; i < bookmarks.length; i++) {
                if (bookmarks[i].contest === contest && bookmarks[i].task === task) {
                    bookmarked = true;
                    index = i;
                    break;
                }
            }
            if (bookmarked) {
                bookmarks.splice(index, 1);
                bookmark.innerHTML = "Bookmark";
                bookmark.style.backgroundColor = "#ffffff";
                bookmark.style.color = "#333";
            } else {
                bookmarks.push({ contest: contest, task: task });
                bookmark.innerHTML = "Bookmarked";
                bookmark.style.backgroundColor = "#4CAF50";
                bookmark.style.color = "#fff";
            }
            chrome.storage.sync.set({ bookmarks: bookmarks });
        });
    });
}

function ratingBackgroundColor(rating){
    const internationalGrandmaster  = 'rgba(255,51 ,51 ,0.9)';
    const grandmaster               = 'rgba(239,0,0,0.9)';
    const internationalMaster       = 'rgba(254,128,0,0.9)';
    const master                    = 'rgba(192,192,0,0.9)';
    const candidateMaster           = 'rgba(0,0,245,0.9)';
    const expert                    = 'rgba(0,192,192,0.9)';
    const specialist                = 'rgba(0,127,0,0.9)';
    const pupil                     = 'rgba(128,64,0,0.9)';
    const newbie                    = 'rgb(128, 128, 128, 0.9)';
    if(rating>=2800){
      return internationalGrandmaster;
    }else if(rating>=2400 && rating<=2799){
      return grandmaster;
    }else if(rating>=2300 && rating<=2399){
      return internationalMaster;
    }else if(rating>=2000 && rating<=2399){
      return master;
    }else if(rating>=1600 && rating<=1999){
      return candidateMaster;
    }else if(rating>=1200 && rating<=1599){
      return expert;
    }else if(rating>=800 && rating<=1199){
      return specialist;
    }else if(rating>=400 && rating<=799){
      return pupil;
    }else{
      return newbie;
    }
  };