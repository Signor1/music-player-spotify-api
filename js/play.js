
const APIControl = (function () {

    const clientId = '91f2c169****************';
    const clientSecret = '23663272bc***************';

    // private methods
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?country=NG`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 10;

        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {

        // const limit = 10;

        const result = await fetch(`${tracksEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


// UI Module
const UIControl = (function () {

    //object to hold references to html selectors
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    //public methods
    return {

        //method to get input fields
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit)
            }
        },

        // need methods to create select list option
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        // need method to create a track list group item 
        createTrack(id, name) {
            const html = `<li class="list-group-item list-group-item-action list-group-item-dark" id="${id}">${name}</li>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            // this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPControl = (function (UICtrl, APICtrl) {

    // get input field object ref
    const DOMInputs = UICtrl.inputField();

    // get genres on page load
    const loadGenres = async () => {
        //get the token
        const token = await APICtrl.getToken();
        //store the token onto the page
        UICtrl.storeToken(token);
        //get the genres
        const genres = await APICtrl.getGenres(token);
        //populate our genres select element
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    // create genre change event listener
    DOMInputs.genre.addEventListener('change', async () => {
        //reset the playlist
        UICtrl.resetPlaylist();
        //get the token that's stored on the page
        const token = UICtrl.getStoredToken().token;
        // get the genre select field
        const genreSelect = UICtrl.inputField().genre;
        // get the genre id associated with the selected genre
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;
        // get the playlist based on a genre
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);
        // create a playlist list item for every playlist returned
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });


    // create submit button click event listener
    DOMInputs.submit.addEventListener('click', async (e) => {
        // prevent page reset
        e.preventDefault();
        // clear tracks
        UICtrl.resetTracks();
        //get the token
        const token = UICtrl.getStoredToken().token;
        // get the playlist field
        const playlistSelect = UICtrl.inputField().playlist;
        // get track endpoint based on the selected playlist
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // get the list of tracks
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);

        let musicBg = document.getElementById("music-holder");
        let now_playing = document.querySelector(".now-playing");
        let track_art = document.querySelector(".track-art");
        let track_name = document.querySelector(".track-name");
        let track_artist = document.querySelector(".track-artist");

        //getting the function buttons of play, pause, next and prev
        let playpause_btn = document.querySelector(".playpause-track");
        let randomPlay = document.getElementById('randomTrack');
        let repeatSong = document.getElementById('repeatTrack');
        let playpauseSong = document.getElementById('playpauseTrack');
        let nextSong = document.getElementById('nextTrack');
        let prevSong = document.getElementById('prevTrack');

        let seek_slider = document.querySelector(".seek_slider");
        let volume_slider = document.querySelector(".volume_slider");
        let current_time = document.querySelector(".current-time");
        let total_duration = document.querySelector(".total-duration");
        let move = document.querySelector('.wrapper');
        let randomIcon = document.querySelector(".fa-random");
        let current_track = document.createElement("audio");

        let track_index = 0;
        let isPlaying = false;
        let isRandom = false;
        let updateTimer;

        loadTrack(track_index);
        
        function loadTrack(track_index) {
            clearInterval(updateTimer);
            //reset
            reset();

            current_track.src = tracks[track_index].track.preview_url;
            current_track.load();

            track_art.style.backgroundImage = "url(" + tracks[track_index].track.album.images[0].url + ")";
            musicBg.style.backgroundImage = "url(" + tracks[track_index].track.album.images[0].url + ")";
            
            track_name.textContent = tracks[track_index].track.name;
            if(tracks[track_index].track.artists.length == 2){
                track_artist.textContent = tracks[track_index].track.artists[0].name + " " + "Ft" + " " + tracks[track_index].track.artists[1].name;
            }else if(tracks[track_index].track.artists.length == 1){
                track_artist.textContent = tracks[track_index].track.artists[0].name;
            }
        
            now_playing.textContent = "Playing music " + (track_index + 1) + " of " + tracks.length;

            updateTimer = setInterval(setUpdate, 1000);

            //event for playnext after track ends
            current_track.addEventListener('ended', nextTrack);

            //event for randomPlay
            randomPlay.addEventListener('click', randomTrack);

            //event for repeatTrack
            repeatSong.addEventListener('click', repeatTrack);

            //event for play/pauseTrack
            playpauseSong.addEventListener('click', playpauseTrack);

            //event for nextTrack
            nextSong.addEventListener('click', nextTrack);

            //event for prevTrack
            prevSong.addEventListener('click', prevTrack);

            //seekTo Event
            seek_slider.addEventListener('change', seekTo);

            //event for volume slider
            volume_slider.addEventListener('change', setVolume);

            let olTag = document.querySelector('.song-list');
            createLi();
            const allliTag = olTag.querySelectorAll('li');
            
            for(var j = 0; j < allliTag.length; j++){

                if(allliTag[j].classList.contains("playing")){
                    allliTag[j].classList.remove("playing");
                }
                if(allliTag[j].getAttribute("id") == track_index){
                    allliTag[j].classList.add("playing");
                }

                allliTag[j].addEventListener("click", getList);
            }
    
        }//end of loadtrack function

        function getList(e){
            let getLiIndex = e.target.id;
            let num = parseInt(getLiIndex);
            // console.log(num);
            track_index = num;
            loadTrack(track_index);
            playTrack();
        }

        function reset() {
            current_time.textContent = "00:00";
            total_duration.textContent = "00:00";
            seek_slider.value = 0;
            
        }
        function randomTrack() {
            isRandom ? pauseRandom() : playRandom();
        }
        function playRandom() {
            isRandom = true;
            randomIcon.classList.add('randomActive');
        }
        function pauseRandom() {
            isRandom = false;
            randomIcon.classList.remove('randomActive');
        }
        function repeatTrack() {
            let current_index = track_index;
            loadTrack(current_index);
            playTrack();
        }
        function playpauseTrack() {
            isPlaying ? pauseTrack() : playTrack();
        }
        function playTrack() {
            current_track.play();
            isPlaying = true;
            track_art.classList.add('rotate');
            move.classList.add('loader');
            playpause_btn.innerHTML = '<i class="fas fa-pause-circle fa-3x"></i>';
        }
        function pauseTrack() {
            current_track.pause();
            isPlaying = false;
            track_art.classList.remove('rotate');
            move.classList.remove('loader');
            playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-3x"></i>';
        }
        function nextTrack() {
            if (track_index < tracks.length - 1 && isRandom === false) {
                track_index += 1;
            } else if (track_index < tracks.length - 1 && isRandom === true) {
                let random_index = Number.parseInt(Math.random() * tracks.length);
                track_index = random_index;
            } else {
                track_index = 0
            }
            loadTrack(track_index);
            playTrack();
        }
        function prevTrack() {
            if (track_index > 0) {
                track_index -= 1;
            } else {
                track_index = tracks.length - 1;
            }
            loadTrack(track_index);
            playTrack();
        }
        function seekTo() {
            let seekTo = current_track.duration * (seek_slider.value / 100);
            current_track.currentTime = seekTo;
        }
        function setVolume() {
            current_track.volume = volume_slider.value / 100;
        }
        function setUpdate() {
            let seekPosition = 0;
            if (!isNaN(current_track.duration)) {
                seekPosition = current_track.currentTime * (100 / current_track.duration);
                seek_slider.value = seekPosition;

                let currentMinutes = Math.floor(current_track.currentTime / 60);
                let currentSeconds = Math.floor(current_track.currentTime - currentMinutes * 60);
                let durationMinutes = Math.floor(current_track.duration / 60);
                let durationSeconds = Math.floor(current_track.duration - durationMinutes * 60);

                if (currentSeconds < 10) { currentSeconds = "0" + currentSeconds; }
                if (durationSeconds < 10) { durationSeconds = "0" + durationSeconds; }
                if (currentMinutes < 10) { currentMinutes = "0" + currentMinutes; }
                if (durationMinutes < 10) { durationMinutes = "0" + durationMinutes; }

                current_time.textContent = currentMinutes + ":" + currentSeconds;
                total_duration.textContent = durationMinutes + ":" + durationSeconds;
                current_time.innerContent = currentMinutes + ":" + currentSeconds;
                total_duration.innerContent = durationMinutes + ":" + durationSeconds;

            }
        }

        function createLi(){
            const olTag = document.querySelector('.song-list');
            for(let i = 0; i < tracks.length; i++){
                const liTag = `<li id="${i}" class="list-group-item list-group-item-action list-group-item-dark">
                               ${tracks[i].track.name}  By  ${tracks[i].track.artists[0].name} </li>`;
                           olTag.insertAdjacentHTML("beforeend", liTag);    
            }
        }
        
        // tracks.forEach(el => UICtrl.createTrack(el.track.preview_url, el.track.name + " " + "By" + " " + el.track.artists[0].name));

    });

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }

})(UIControl, APIControl);

// will need to call a method to load the genres on page load
APPControl.init();
