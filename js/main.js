// Constants

const localVideo = document.querySelector('#local-video');
const remoteVideo = document.querySelector('#remote-video');

const btnStart = document.querySelector('#start');
const btnStop = document.querySelector('#stop');
const btnLoadSession = document.querySelector('#btn-load-session');

const localSessionData = document.querySelector('#local-session-data');
const inputRemoteSessionData = document.querySelector('#input-remote-session-data');

const servers = null;
const mediaConstraints = {audio:false, video:true};

trace('Creating RTCPeerConnection.');
let pc = new RTCPeerConnection(servers);
trace('Done creating RTCPeerConnection.');


// Event-Binding

btnStart.onclick = function(event) {
    trace('Getting userMedia. Constraints: ' + mediaConstraints);
    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream) => {
        trace('Attach stream to pc and video tag. Stream: ' + stream);
        pc.addStream(stream);
        localVideo.srcObject = stream;
        localVideo.play();
        trace('Create Offer from stream');
        return pc.createOffer();
    })
    .then((offer) => {
        trace('Set local description with offer: ' + offer);
        pc.setLocalDescription(new RTCSessionDescription(offer));
        return pc.localDescription;
    })
    .then((description) => {
        trace('Obtained local description: ' + description);
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

// let local = new RTCPeerConnection();

// local.onicecandidate = function(e){
//     if (e.candidate){
//         remote.addIceCandidate(e.candidate);
//     }};

// navigator.mediaDevices.getUserMedia({audio: false, video: true})
// .then(stream => {
//     localVideo.srcObject = stream;
//     local.addStream(stream);
//     return local.createOffer();
// })
// .then(offer => local.setLocalDescription(new RTCSessionDescription(offer)))
// .then(() => remote.setRemoteDescription(local.localDescription))
// .then(() => remote.createAnswer())
// .then(answer => remote.setLocalDescription(new RTCSessionDescription(answer)))    
// .then(() => local.setRemoteDescription(remote.localDescription));

// remote.ontrack = e => {
//     remoteVideo.srcObject = e.streams[0];
// }

// Util functions

function stopAllStreamsFor(mediaElement){
    if (!mediaElement.srcObject) return;

    tracks = mediaElement.srcObject.getTracks();
    tracks.forEach((track) => {
        track.stop();
    });
}



// Log helper.
function trace(text){
    console.log(text);
}