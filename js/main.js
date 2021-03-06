// Constants

const localVideo = document.querySelector('#local-video');
const remoteVideo = document.querySelector('#remote-video');

const btnStart = document.querySelector('#start');
const btnStop = document.querySelector('#stop');
const btnLoadSession = document.querySelector('#btn-load-session');

const btnCopySession = document.querySelector('#btn-copy-session');
const btnCopyIceCandidate = document.querySelector('#btn-copy-ice-candidate');

const localSessionData = document.querySelector('#local-session-data');
const inputRemoteSessionData = document.querySelector('#input-remote-session-data');
const localIceCandidate = document.querySelector('#local-ice-candidate');
const inputIceCandidate = document.querySelector('#input-ice-candidate');

const radioSessionTypeOffer = document.querySelector('#radio-session-type-offer');
const radioSessionTypeAnswer = document.querySelector('#radio-session-type-answer');

const servers = null;
const mediaConstraints = {audio:false, video:true};

trace('Creating RTCPeerConnection.');
let pc = new RTCPeerConnection(servers);
trace('Done creating RTCPeerConnection.');


// Event-Binding

btnStart.onclick = function(event) {
    trace('Getting userMedia. Constraints: ', mediaConstraints);
    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream) => {
        trace('Attach stream to pc and video tag. Stream: ', stream);
        pc.addStream(stream);
        localVideo.srcObject = stream;
        localVideo.play();
        radioSessionTypeAnswer.checked = true;        
        trace('Create Offer from stream');
        return pc.createOffer();
    })
    .then((offer) => {
        trace('Set local description with offer: ', offer);
        pc.setLocalDescription(offer);
        return pc.localDescription;
    })
    .then((description) => {
        trace('Obtained local description: ', description);
        if (description.sdp)
            localSessionData.innerHTML = description.sdp;
    });
}

btnStop.onclick = function(event) {
    if (localVideo.srcObject)
        stopAllStreamsFor(localVideo);
    if (remoteVideo.srcObject)
        stopAllStreamsFor(remoteVideo);
}

btnLoadSession.onclick = function(event) {
    if (!inputRemoteSessionData.value || inputRemoteSessionData.value.trim() == '') return;

    trace('Loading Session data from input text: ', inputRemoteSessionData.text);

    // This constructor is deprecated. DO NOT USE IN ACTUAL CODE.
    let rtcSessionDesc = new RTCSessionDescription();
    rtcSessionDesc.type = getSessionType();

    // Add new-line to last char if missing.
    sdpDOMString = inputRemoteSessionData.value;
    if (sdpDOMString.slice(-1) !== '\n') sdpDOMString += '\n'; 

    rtcSessionDesc.sdp = sdpDOMString;

    trace('Created RTCSessionDescription object: ', rtcSessionDesc);

    // This works because set...Description() fns now allow RTCSessionDescriptionInit Dictionary.
    pc.setRemoteDescription(rtcSessionDesc)
    .then(() => {

        trace('Remote Description set to: ', pc.remoteDescription);

        // Both descriptions set. Nothing to do.
        if (pc.localDescription.sdp) {
            trace('Local Description already set. All done.');
            return;
        }

        //Load stream, Set Local description and create answer to the offer.
        else {
            trace('Need to load stream, Set Local description and create answer to the offer: ', rtcSessionDesc);
            return navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then((stream) => {
                    trace('Attach stream to pc and video tag. Stream: ', stream);
                    pc.addStream(stream);
                    localVideo.srcObject = stream;
                    localVideo.play();
                    trace('Create answer from stream');
                    return pc.createAnswer();
                })
                .then((answer) => {
                    trace('Set local description with answer: ', answer);
                    pc.setLocalDescription(answer);
                    localSessionData.innerHTML = pc.localDescription.sdp;
                    return pc.localDescription;
                });
        }
    });
}

pc.ontrack = function(event){
    trace('OnTrack event, ' , event);
    if (event.streams){
        remoteVideo.srcObject = event.streams[0];
    }
}

inputIceCandidate.oninput = function(event){
        obj = JSON.parse(inputIceCandidate.value);
        obj.__proto__ = RTCIceCandidate.prototype;

        trace('Parsed ICE Candidate: ', obj);

        pc.addIceCandidate(obj)
        .then(() => trace('ICE Candidate added to Peer connection: ', obj));
}

pc.onicecandidate = function(event) {
    if (event.candidate){
        trace('Generated ICE Candidate: ', event.candidate);
        localIceCandidate.innerHTML = JSON.stringify(event.candidate);
    }
}

// Copy Events

btnCopySession.onclick = function(event){
    navigator.clipboard.writeText(localSessionData.innerHTML);
}

btnCopyIceCandidate.onclick = function(event){
    navigator.clipboard.writeText(localIceCandidate.innerHTML);
}

// Util functions

function stopAllStreamsFor(mediaElement){
    trace('Stopping tracks for element', mediaElement);
    if (!mediaElement.srcObject) return;

    tracks = mediaElement.srcObject.getTracks();
    tracks.forEach((track) => {
        track.stop();
    });
}

function getSessionType(){
    return radioSessionTypeOffer.checked?
     "offer" : "answer";
}

// Log helper.
function trace(text, obj=null){
    console.log(text);
    
    err = document.querySelector('.error');
    t= document.createTextNode(text + '\n');
    err.appendChild(t);
    err.appendChild(document.createElement('br'));

    if (obj != null) console.log(obj);
}