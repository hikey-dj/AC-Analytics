var problems = new Map();
var ratings = new Map();
var problem_desc = new Map();
let submissions = [];
var ratingChartLabel = [];
var ratingChartData = [];
var ratingChartBackgroundColor = [];

console.log(problems);
if(window.location.href.includes("atcoder.jp/users/")){
  chrome.runtime.sendMessage({todo:"appendHTML"},function(response){
    //DOM for the chart
    $('#main-container').children(':first').children(':nth-child(3)').append(response.htmlResponse);

    //Execute stat and graph code
    const profileId = getProfileIdFromUrl(window.location.href);
    const lastDir = window.location.href.split('/').pop();
    console.log("Profile ID: ", profileId[0]);
    let sec = 0;
    fetchSubmissions(profileId[0], sec, submissions).then(() => {
      processData(submissions).then(() => {
        if(lastDir === profileId[0]){
          createProblemRatingChart();
          addCalendar();
          addStats();
        }
        createSubmissionTab();
      })
    }).catch((error) => {
        console.log("Error: ", error);
    });
  });
}

function addCalendar(){
  let DOM = $('#activityCalendar');
  //PLOT BOXES FOR EACH DATE IN THE CALENDAR
  let date = new Date();
  let endDate = new Date(date.toDateString());
  endDate.setHours(0, 0, 0, 0);
  let startDate = new Date(date.toDateString());
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate()-365);

  let dayCount = new Map();

  submissions.forEach(function(sub){
    let date = new Date(sub.epoch_second * 1000);
    date.setHours(0, 0, 0, 0);
    date = new Date(date.toDateString());
    if(sub.result !== "AC") return;
    if(dayCount.has(date.getTime())){
      let cnt = dayCount.get(date.getTime());
      cnt++;
      dayCount.set(date.getTime(),cnt);
    }else{
      dayCount.set(date.getTime(),1);
    }
  });

  //For loop iterating over all the dates
  let week = 0;
  let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.id = "week-0";
  g.setAttribute("transform","translate(0,0)");
  DOM.append(g);
  while(startDate.getTime() <= endDate.getTime()){
    let day = startDate.getDay();
    if(day === 0){
      week++;
      let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.id = `week-${week}`;
      g.setAttribute("transform", `translate(${week*14},0)`);
      DOM.append(g);
    }
    let cnt = dayCount.get(startDate.getTime());
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", `${24 + day * 14}`);
    rect.setAttribute("width", "13");
    rect.setAttribute("height", "13");
    rect.setAttribute("rx", "2");
    rect.setAttribute("ry", "2");
    rect.setAttribute("fill", getDateColor(cnt));
    rect.setAttribute("data-date", startDate.toDateString());
    rect.setAttribute("data-level", cnt);
    $('#week-' + week).append(rect);
    // If it is the first day of the month then add the month label
    if(startDate.getDate() === 1){
      let monthText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      monthText.setAttribute("x", `${week * 14}`);
      monthText.setAttribute("y", "12");
      monthText.textContent = startDate.toDateString().split(' ')[1];
      $('#month').append(monthText);
    }
    startDate.setDate(startDate.getDate()+1); 
  }
}

function getDateColor(cnt){
  if(cnt === 0 || cnt === undefined){
    return "#ebedf0";
  }else if(cnt <= 1){
    return "#c6e48b";
  }else if(cnt <= 2){
    return "#7bc96f";
  }else if(cnt <= 3){
    return "#239a3b";
  }else{
    return "#196127";
  }
}

async function processData(resultArr){
  let allProblems = new Map();
  await $.get("https://kenkoooo.com/atcoder/resources/problem-models.json", function(response){
    allProblems = response;
  });

  problems = new Map();
  for(var i = resultArr.length-1;i>=0;i--){
    let sub = resultArr[i];
    let problemId = sub.problem_id;
    let sub_rat = 0;
    if(allProblems[problemId]) sub_rat = allProblems[problemId].difficulty;
    sub_rat = Math.max(0,Math.floor(sub_rat/100)*100);

    if(!problems.has(problemId)){
      problems.set(problemId,{
        solved: false,
        rating: sub_rat,
        time: sub.epoch_second,
        contestId: sub.contest_id,
        index: sub.problem_id,
      });
    }
    if(sub.result === "AC"){
      let obj = problems.get(problemId);
      obj.solved = true;
      problems.set(problemId,obj);
    }
  }
  let unsolvedCount = 0;
  problems.forEach(function(prob){
    if(prob.rating && prob.solved===true){
      if(!ratings.has(prob.rating)){
        ratings.set(prob.rating,0);
      }
      let cnt = ratings.get(prob.rating);
      cnt++;
      ratings.set(prob.rating,cnt);
    }
    if(prob.solved===false){
      unsolvedCount++;
      const problemURL = findProblemURL(prob.contestId,prob.index);
      $('#unsolved_list').append(`
          <a class="unsolved_problem" href="${problemURL}">
            ${prob.index}
          </a>
          <i>&nbsp|&nbsp</i>
      `);
      $('#unsolved_list').append(`    `);
    }
  })
  $('#unsolved_count').text(`Count : ${unsolvedCount}`);
  for(let[key,val] of ratings){
    ratingChartLabel.push(key);
    ratingChartData.push(val);
    ratingChartBackgroundColor.push(ratingBackgroundColor(key));
  }
}

async function fillSubmissions(){
  //MODIFY THE DOM
  $('#main-container').children(':first').children(':nth-child(2)').remove();
    $('#main-container').children(':first').children(':nth-child(2)').remove();
    let submissionsDOM = document.createElement('div');
    submissionsDOM.innerHTML = `<h3 class = "col-sm-12">Submissions</h3><div id="submissions" class = "col-sm-12" style = "display: flex; flex-direction: column; align-items: center; justify-content: center;";></div>`;
    $('#main-container').children(':first').append(submissionsDOM);

    // Get Data
    submissions.sort((a,b) => b.epoch_second - a.epoch_second);
    
    await $.get('https://kenkoooo.com/atcoder/resources/problems.json', function(response){
      for(var i = response.length-1;i>=0;i--){
        let prob = response[i];
        problem_desc.set(prob.id,{...prob});
      };
    });    

    let table = document.createElement('table');
    table.classList.add('submissions-table');
    table.innerHTML = `<tr><th>ID</th><th>Problem</th><th>Result</th><th>Rating</th><th>Time</th></tr>`;
    $('#submissions').append(table);    

    // Create Pagination
    loadPage(1);
    createPageButton(1);
}

function createPageButton(k){
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

  console.log(submissions)
  let n = Math.ceil(submissions.length/20);
  while(s <= n){
    s = s + p;
    p = p * 2;  
    if(k + s <= n){
      let page = document.createElement('li');
      page.innerHTML = `<a class="page-link" href="#">${k+s}</a>`;
      const pno = k+s;
      page.addEventListener('click', () => {
        loadPage(pno);
        $(".pagination").remove();
        createPageButton(pno);
      });
      pagination.appendChild(page);
    }
    if(k - s > 0){
      let page = document.createElement('li');
      page.innerHTML = `<a class="page-link" href="#">${k-s}</a>`;
      const pno = k-s;
      page.addEventListener('click', () => {
        loadPage(pno);
        $(".pagination").remove();
        createPageButton(pno);
      });
      pagination.prepend(page);
    }
  }

  $('#submissions').append(pagination);
}

function loadPage(k){
  let table = $('.submissions-table');
  table.empty();
  table.append(`<tr><th>ID</th><th>Problem</th><th>Result</th><th>Rating</th><th>Time</th></tr>`);
  for(var i = (k-1)*20; i < Math.min(k*20,submissions.length); i++){
    let sub = submissions[i];
    let row = document.createElement('tr');
    let id = document.createElement('td');
    id.innerHTML = `<a href="https://atcoder.jp/contests/${sub.contest_id}/submissions/${sub.id}">${sub.id}</a>`;      
    row.appendChild(id);
    let problemURL = findProblemURL(sub.contest_id,sub.problem_id);
    let problem = document.createElement('td');
    //console.log(sub.problem_id,problem_desc.get(sub.problem_id));
    problem_desc.get(sub.problem_id) ? problem.innerHTML = `<a href="${problemURL}">${problem_desc.get(sub.problem_id).name}</a>`
                                 : problem.innerHTML = `<a href="${problemURL}">${sub.problem_id}</a>`;
    row.appendChild(problem);
    let result = document.createElement('td');
    result.innerText = sub.result;
    row.appendChild(result);
    let rating = document.createElement('td');
    rating.innerHTML = `<div style="color:${ratingBackgroundColor(problems.get(sub.problem_id).rating)}">${problems.get(sub.problem_id).rating ? problems.get(sub.problem_id).rating : 0}</div>`;
    row.appendChild(rating);
    let time = document.createElement('td');
    let date = new Date(sub.epoch_second*1000);
    time.innerText = date.toLocaleString();
    row.appendChild(time);
    table.append(row);
  }
}


function createSubmissionTab(){
  let tabs = $('#user-nav-tabs');
  let submissionsTab = document.createElement('li');
  submissionsTab.classList.add('nav-item');
  submissionsTab.innerHTML = `<a class="nav-link" href="#" data-toggle="tab" style = "display: flex;"></a>`;
  let submissionsIcon = document.createElement('img');
  submissionsIcon.alt = "Submissions";
  submissionsIcon.src = chrome.runtime.getURL("src/asset/submit.svg");
  submissionsIcon.style = "line-height:1; margin-right:5px;height: 18px; width: 18px;";
  submissionsTab.children[0].appendChild(submissionsIcon);
  let submissionsText = document.createTextNode("Submissions");
  submissionsTab.children[0].appendChild(submissionsText);
  tabs.append(submissionsTab);
  submissionsTab.addEventListener('click', fillSubmissions);
}

function addStats(){
  // DOM for the stats
  let table = $('#main-container').children(':first').children(':nth-child(3)').children(':nth-child(3)').children(':first');
  table.append(`<tr><th class="no-break">Problems Solved</th><td>${problems.size}</td></tr>`);
  var currStreak = 0;
  var maxStreak = 0;
  var date = new Date();
  // Sort problems by time of submission
  problems = new Map([...problems.entries()].sort((a, b) => a[1].time - b[1].time));

  // Calculate streak based on day of submission
  problems.forEach(function(prob){ 
    if(prob.solved && 
        (currStreak === 0 || 
          (((prob.time - date.getTime()/1000)/(60*60*24) > 1) && ((prob.time - date.getTime()/1000)/(60*60*24) < 2)
          )
        )
      ){
      currStreak++;
      maxStreak = Math.max(maxStreak, currStreak);
      date.setTime(prob.time*1000);
      date = new Date(date.toDateString());         
    } else{
      if(prob.solved && (prob.time - date.getTime()/1000)/(60*60*24) >= 2){
        currStreak = 1;
        maxStreak = Math.max(maxStreak, currStreak);
        date.setTime(prob.time*1000);
        date = new Date(date.toDateString());   
      }
    }
  });
  // Longest Streak
  table.append(`<tr><th class="no-break">Longest Streak</th><td>${maxStreak}</td></tr>`);

}

function fetchSubmissions(profileID, sec, submissions) {
  return new Promise((resolve, reject) => {
      $.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${profileID}&from_second=${sec}`,
          function(response){
              //console.log(response);
              if(response.length > 0){
                  submissions.push(...response);
                  if(response.length == 500){
                      let seconds = submissions[submissions.length - 1].epoch_second + 1;
                      fetchSubmissions(profileID, seconds, submissions).then(() => {resolve();});
                  } else {
                      resolve();
                  }
              }else{
                  reject(response + ' ' + response);
              }      
          }
      );
  });
}


function getProfileIdFromUrl(url){
  var arr = url.split("/");
  temp = arr[4].split('?',1);
  return temp;
}


ratings[Symbol.iterator] = function* () {
  yield* [...ratings.entries()].sort((a, b) =>{
    if(a[0]<b[0]){
      return -1;
    }else if(a[0]>b[0]){
      return 1;
    }else return 0;
  } );
}

function findProblemURL(contestId,index){
  return `https://atcoder.jp/contests/${contestId}/tasks/${index}`;
}

function createProblemRatingChart(){
  var ctx = document.getElementById('problemRatingChart').getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ratingChartLabel,
          datasets: [{
              label: 'Problems Solved',
              data: ratingChartData,
              backgroundColor: ratingChartBackgroundColor,
              borderColor: 'rgba(0  ,0  ,0  ,1)',//ratingChartBorderColor,
              borderWidth: 0.75,
          }]
      },
      options: {
          aspectRatio : 2.5,
          scales: {
            x: {
              title:{
                text: 'Problem Rating',
                display: false,
              }
            },
            y: {
                title:{
                  text: 'Problems Solved',
                  display: false,
                },
                beginAtZero: true
            }
          }
      }
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

