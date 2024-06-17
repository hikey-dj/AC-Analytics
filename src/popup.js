$(document).ready(function(){
    chrome.storage.sync.get(['hour', 'minute', 'time', 'reminder'], function(data){
        if(data.reminder){
            $('#cb').prop('checked', true);
            $('#hour').val(data.hour);
            $('#minute').val(data.minute);
            $('#time').val(data.time);
        }
    });

    $('#cb').change(async function(){
        if($(this).is(':checked')){
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({'reminder': true});  
                resolve();
            })
        }else{
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({'reminder': false});  
                resolve();
            })
        }
        chrome.runtime.sendMessage({update: true});
    });

    $('#hour').change(async function(){
        if($(this).val() > 12){
            return;
        }
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set({'hour': $(this).val()});
            resolve();
        })
        chrome.runtime.sendMessage({update: true});
    });

    $('#minute').change(async function(){
        if($(this).val() > 59){
            return;
        }
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set({'minute': $(this).val()});
            resolve();
        })
        chrome.runtime.sendMessage({update: true});
    });

    $('#time').change(async function(){
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set({'time': $(this).val()});
            resolve();
        })
        chrome.runtime.sendMessage({update: true});
    });
});