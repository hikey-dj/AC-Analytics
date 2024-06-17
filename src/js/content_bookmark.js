addBookmarkToNavbar();
addProblemSetToNavbar();
var contests = new Map();
var problemModels = new Map();
var problems = new Map();
var problemArray = [];
var filteredProblems = [];


function addProblemSetToNavbar() {
    var problemSet = document.createElement('li');
    problemSet.id = 'bookmark';
    problemSet.innerHTML = '<a href="#">ProblemSet</a>';
    if($('#navbar-collapse > .navbar-nav').children.length > 1){
        $('#navbar-collapse > .navbar-nav')[0].append(problemSet);
    }
  
    problemSet.addEventListener('click', async () => {
        if(Object.keys(problems).length === 0 || Object.keys(problemModels).length === 0){
            await fetchData();
        }
        let DOM = $("#main-container");
        DOM.empty();
    
        DOM.append('<h2 class="row col-sm-12">Problem Set</h2><div class = "col-sm-12" id="filter"></div><div class = "col-sm-12" id="PS-container" style = "display: flex; flex-direction: column; align-items: center; justify-content: center;"></div>')        
        DOM = $("#filter");
        //Option to hide filter with transition
        DOM.append('<div class="row flex justify-center"><div class="col-sm-4"><span aria-hidden="true" class="glyphicon glyphicon-cog pointer" id = "filterButton">Filter</span></div></div>');
        $('#filterButton').on('click', function(){
            $('#form').toggle();
        });
        DOM.append('<div id ="form" class = "mt-1"><div class = "mb-2"><input type="text" id="search" style = "width:45%" class="form-control" placeholder="Search by name, contest or task"></div></div>');
        $('#search').on('input', function(){
            let search = $('#search').val().toLowerCase();
            filteredProblems = problemArray.filter((problem) => (problems[problem.id].name.toLowerCase().includes(search) &&  search.length != 1)|| 
                                                                (problem.contest_id.toLowerCase().includes(search) && search.length != 1)||
                                                                problem.problem_index.toLowerCase().includes(search));
            loadPagePS(1);
            createPageButtonPS(1);
        });            
        DOM = $("#form");
        //Search by rating, upper and lower bound
        DOM.append('<div class="row mt-2 align-center"><div class="col-sm-2"><input type="number" id="lower" class="form-control" placeholder="Min Rating"></div><div class="col-sm-2"><input type="number" id="upper" class="form-control" placeholder="Max Rating"></div><div class="col-sm-4"><button class="btn btn-primary" id="rating">Search</button></div></div>');
        $('#rating').on('click', function(){
            let lower = $('#lower').val();
            let upper = $('#upper').val();
            if(lower !== '' && upper !== ''){
                filteredProblems = problemArray.filter((problem) => (problemModels[problem.id] && problemModels[problem.id].difficulty >= lower && problemModels[problem.id].difficulty <= upper));
            }
            else if(lower !== ''){
                filteredProblems = problemArray.filter((problem) => (problemModels[problem.id] && problemModels[problem.id].difficulty >= lower));
            }
            else if(upper !== ''){
                filteredProblems = problemArray.filter((problem) => (problemModels[problem.id] && problemModels[problem.id].difficulty <= upper));
            }
            loadPagePS(1);
            createPageButtonPS(1);
        });
        $('#form').toggle();

        filteredProblems = problemArray;
        loadPagePS(1);
        createPageButtonPS(1);
    });
}

function loadPagePS(k){
    DOM = $("#PS-container");
    DOM.empty();

    let table = document.createElement('table');
    table.classList.add('submissions-table');
    let header = document.createElement('tr');
    let contest = document.createElement('th');
    contest.innerHTML = 'Contest';
    let task = document.createElement('th');
    task.innerHTML = 'Task';
    let name = document.createElement('th');
    name.innerHTML = 'Name';
    let rating = document.createElement('th');
    rating.innerHTML = 'Rating';
    header.append(contest, task, name, rating);
    table.append(header);
    DOM.append(table);
    for(var i = (k-1)*20; i < Math.min(k*20,filteredProblems.length); i++){
        let prob = filteredProblems[i];
        let row = document.createElement('tr');
        let contest = document.createElement('td');
        contest.innerHTML = `<a href = "${findContestURL(prob.contest_id)}">${prob.contest_id.charAt(0).toUpperCase() + prob.contest_id.slice(1)}</a>`;
        let task = document.createElement('td');
        task.innerHTML = `<a href = "${findProblemURL(prob.contest_id,prob.id)}">${prob.problem_index}</a>`;
        let name = document.createElement('td');
        name.innerHTML = prob.name;
        let rating = document.createElement('td');
        let difficulty = problemModels[prob.id] ? Math.max(0,Math.floor(problemModels[prob.id].difficulty/100)*100)
                                                : 0;
        rating.innerHTML = difficulty;
        rating.style.color = ratingBackgroundColor(difficulty);

        row.append(contest, task, name, rating);
        table.append(row);
    }
}

function createPageButtonPS(k){
    let pagination = document.createElement('ul');
    pagination.classList.add('pagination');
    pagination.classList.add('pagination-sm');
    pagination.classList.add('mt-2');
    pagination.classList.add('mb-1');
    pagination.classList.add('mx-auto');
    let page1 = document.createElement('li');
    page1.innerHTML = `<a class="page-link" href="#">${k}</a>`;
    page1.classList.add('active');
    //page1.addEventListener('click', loadPage(k));
    pagination.appendChild(page1);
  
    let p = 1, s = 0;
  
    let n = Math.ceil(filteredProblems.length/20);
    while(s <= n){
      s = s + p;
      p = p * 2;  
      if(k + s <= n){
        let page = document.createElement('li');
        page.innerHTML = `<a class="page-link" href="#">${k+s}</a>`;
        const pno = k+s;
        page.addEventListener('click', () => {
          loadPagePS(pno);
          //$(".pagination").remove();
          createPageButtonPS(pno);
        });
        pagination.appendChild(page);
      }
      if(k - s > 0){
        let page = document.createElement('li');
        page.innerHTML = `<a class="page-link" href="#">${k-s}</a>`;
        const pno = k-s;
        page.addEventListener('click', () => {
          loadPagePS(pno);
          //$(".pagination").remove();
          createPageButtonPS(pno);
        });
        pagination.prepend(page);
      }
    }
  
    let DOM = $("#PS-container");
    DOM.append(pagination);
}

function addBookmarkToNavbar() {
  var bookmark = document.createElement('li');
  bookmark.id = 'bookmark';
  bookmark.innerHTML = '<a href="#">Bookmark</a>';
  $('#navbar-collapse > .navbar-right')[0].prepend(bookmark);

  bookmark.addEventListener('click', bookmarkPage);
}

async function bookmarkPage() {
    if(Object.keys(problems).length === 0 || Object.keys(problemModels).length === 0){
        await fetchData();
    }
    var bookmark = [];
    bookmark = await new Promise((resolve, reject) => {
        chrome.storage.sync.get('bookmarks', function(data) {
            var bookmarks = data.bookmarks;
            console.log(data.bookmarks);
            if (bookmarks === undefined) {
                bookmarks = [];
            }
            resolve(bookmarks);
        });
    });

    let DOM = $("#main-container");
    DOM.empty();
    DOM.append('<div class="row col-md-12"><h2>Bookmarks</h2></div>')
    DOM = DOM.children(":first");

    if(bookmark.length === 0){
        DOM.append('<div class="ml-2"></br><p>Hey! You may add Bookmarks in the problems page to see here.</br></br>Do it later or keep interesting problems here :)</p></div>');
    }
    else{
        let table = document.createElement('table');
        table.classList.add('submissions-table');
        let header = document.createElement('tr');
        let contestHeader = document.createElement('th');
        contestHeader.innerHTML = 'Contest';
        let taskHeader = document.createElement('th');
        taskHeader.innerHTML = 'Task';
        let ratingHeader = document.createElement('th');
        ratingHeader.innerHTML = 'Rating';
        let removeHeader = document.createElement('th');
        removeHeader.innerHTML = 'Remove';
        header.append(contestHeader, taskHeader, ratingHeader, removeHeader);
        table.append(header);

        DOM.append(table);
        for (let i = 0; i < bookmark.length; i++) {
            let row = document.createElement('tr');
            let contest = document.createElement('td');
            contest.innerHTML = `<a href = "${findContestURL(bookmark[i].contest,bookmark[i].task)}">${bookmark[i].contest.charAt(0).toUpperCase() + bookmark[i].contest.slice(1)}</a>`;
            let task = document.createElement('td');
            task.innerHTML = `<a href = "${findProblemURL(bookmark[i].contest,bookmark[i].task)}">${problems[bookmark[i].task].name}</a>`;
            let rating = document.createElement('td');
            rating.innerHTML = Math.floor(problemModels[bookmark[i].task].difficulty/100)*100;
            rating.style.color = ratingBackgroundColor(problemModels[bookmark[i].task].difficulty);
            let remove = document.createElement('td');
            remove.innerHTML = '<button class="btn btn-danger btn-sm">Remove</button>';
            remove.addEventListener('click',(i) => removeBookmark(i));

            row.append(contest, task, rating, remove);
            table.append(row);
        }
    }
}

function removeBookmark(index) {
    chrome.storage.sync.get('bookmarks', function(data) {
        var bookmarks = data.bookmarks;
        bookmarks.splice(index, 1);
        chrome.storage.sync.set({ bookmarks: bookmarks });
    });
    bookmarkPage();
}


async function fetchData() {
    await $.get("https://kenkoooo.com/atcoder/resources/problem-models.json", function(data) {
        problemModels = data;
    });
    await $.get("https://kenkoooo.com/atcoder/resources/contests.json", function(data) {
        if(data === null){
            contests = {};
        }
        else{
            for (let i = 0; i < data.length; i++) {
                contests[data[i].id] = data[i];
            }
        }
    });
    await $.get("https://kenkoooo.com/atcoder/resources/problems.json", function(data) {
        problemArray = data;
        if(data === null){
            problems = {};
        }
        else{
            for (let i = 0; i < data.length; i++) {
                problems[data[i].id] = data[i];
            }
            problemArray.sort((a,b) => contests[b.contest_id].start_epoch_second - contests[a.contest_id].start_epoch_second);
        }
    });
}

function findProblemURL(contestId,index){
    return `https://atcoder.jp/contests/${contestId}/tasks/${index}`;
}


function findContestURL(contestId){
    return `https://atcoder.jp/contests/${contestId}`;
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