chrome.runtime.onMessage.addListener( function(request,sender,sendResponse){
    if(request.todo == "appendHTML"){
        fetch(chrome.runtime.getURL('src/graph.html'))
        .then(response => response.text())
        .then(html => {
            sendResponse({
                htmlResponse : html,
            });
        })
        .catch(error => {
            console.error('Error fetching graph.html:', error);
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => update(request,sender,sendResponse));

update({update:true},null,null);

async function update(request,sender,sendResponse){
    if(request.update){
        let reminder,hour,minute,time;
        await new Promise((resolve, reject) => {
            chrome.storage.sync.get('reminder', function(data) {
                reminder = data.reminder;
                resolve();
            });
        });
        console.log("Reminder: ",reminder);
        if(reminder){
            await new Promise((resolve, reject) => {
                chrome.storage.sync.get('hour', function(data) {
                    hour = parseInt(data.hour);
                    resolve();
                });
            });
            console.log("Hour: ",hour);
            await new Promise((resolve, reject) => {
                chrome.storage.sync.get('minute', function(data) {
                    minute = parseInt(data.minute);
                    resolve();
                });
            })
            console.log("Minute: ",minute);
            await new Promise((resolve, reject) => {
                chrome.storage.sync.get('time', function(data) {
                    time = data.time; // AM or PM
                    resolve();
                });
            });
            console.log("Time: ",time);
            let dateTime = new Date();
            hour = (hour == 12) ? 0 : hour;
            hour = (time == "PM") ? (hour+12) : hour;
            console.log("Updated: ",reminder,hour,minute,time)
            dateTime.setHours(hour,minute,0,0);
            await new Promise((resolve, reject) => {
                chrome.alarms.clearAll();   
                resolve();             
            })
            chrome.alarms.create('Alarm', {
                when: dateTime.getTime(),
                periodInMinutes: 1440
            });
        }
        else{
            await new Promise((resolve, reject) => {
                chrome.alarms.clearAll();   
                resolve();             
            })
        }
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("Alarm Triggered");
    chrome.notifications.create('Reminder', {
        type: 'basic',
        iconUrl: '../asset/icon48.png',
        title: 'Coding Reminder',
        message: 'Hey! Did you crush any problems today?'
    });
});