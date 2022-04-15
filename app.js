const baseURL = "https://n-eeraj.github.io/melodify/"
// const baseURL = "http://127.0.0.1:5500/"

const app = Vue.createApp({
	data() {
		return {
			tab: "Home",
			menuItems: [],
			fetchedSongs: [],
			songDetailsList: [],
			artistsList: [],
			playlistsObject: {},
			playerCurrent: {
				nowPlaying: 0,
				playing: false,         
				queue: [],
				time: {
					now: 0,
					end: 0
				}
			},
			audio: null,
			currentArtist: null,
			selectedSong: null,
			selectedPlaylist: null,
			showPopUp: false,
			isLoading: true
		}
	},
	mounted() {
		fetch(baseURL + "/data.json")
		.then(response => response.json())
		.then(data => {
			let fetchedData = data
			this.menuItems = fetchedData.menuItems
			this.fetchedSongs = fetchedData.songs
			this.songDetailsList = this.fetchedSongs
			for (let [name, image] of Object.entries(fetchedData.artists))
			this.artistsList.push({
				name : name,
				image : image
			})
			this.isLoading = false
			this.playlistsObject = JSON.parse(localStorage.getItem('melodifyPlaylist'))
			if (this.playlistsObject === null)
				this.playlistsObject = {}
		})
	},
	methods: {
		selectTab(tab) {
			if (tab === "Home") {
				this.currentArtist = null
				this.songDetailsList = this.fetchedSongs
			}
			if (tab === "Playlist")
				this.selectedPlaylist = null
			this.tab = tab
			this.closePopUp()
		},
		getAudio() {
			let current = this.playerCurrent
			let currentAudio = current.queue[current.nowPlaying].audio
			if (this.audio === null)
				this.audio = new Audio(currentAudio)
			else if(this.audio.src !== baseURL + currentAudio)
				this.audio.src = currentAudio
			else
				return
			this.audio.addEventListener("timeupdate", (e) => {
				this.playerCurrent.time.now = e.srcElement.currentTime
				let duration = e.srcElement.duration
				if (e.srcElement.paused)
					this.togglePlayState(false)
				if (!isNaN(duration))
					this.playerCurrent.time.end = duration
				if (e.srcElement.ended)
					this.playNextSong()
			})
		},
		togglePlayState(play=null) {
			if (play)
				this.playerCurrent.playing = true
			else if (play === false)
				this.playerCurrent.playing = false
			else
				this.playerCurrent.playing = !this.playerCurrent.playing
			if (this.playerCurrent.playing) {
				this.getAudio()
				this.audio.play()
			}
			else 
				this.audio.pause()
			this.closePopUp()
		},
		updateLocalStorage() {
			localStorage.setItem('melodifyPlaylist', JSON.stringify(this.playlistsObject))
		},
		startSong(id) {
			this.playerCurrent.nowPlaying = 0
			this.playerCurrent.queue = [this.songDetailsList.filter(song => song.id === id)[0]]
			this.togglePlayState(true)
		},
		playNext(id){
			let song = this.songDetailsList.filter(song => song.id === id)[0]
			this.playerCurrent.queue.splice(1, 0, song)
			this.closePopUp()
		},
		openPopUp(id) {
			this.selectedSong = id
			this.showPopUp = true
		},
		closePopUp() {
			this.selectedSong = null
			this.showPopUp = false
		},
		selectPlaylistToAddSong(playlistName) {
			if (!this.playlistsObject[playlistName].includes(this.selectedSong))
				this.playlistsObject[playlistName].push(this.selectedSong)
			else
				return alert(`This song is already in ${playlistName}`)
			this.closePopUp()
			this.updateLocalStorage()
		},
		addToQueue(id){
			let song = this.songDetailsList.filter(song => song.id === id)[0]
			this.playerCurrent.queue.push(song)
			this.closePopUp()
		},
		deleteFromQueue(queueIndex) {
			this.playerCurrent.queue = this.playerCurrent.queue.filter((item, index) => index !== queueIndex)
		},
		playPreviousSong() {
			if (this.playerCurrent.nowPlaying !== 0) {
				--this.playerCurrent.nowPlaying
				this.togglePlayState(true)
			}
		},
		playNextSong() {
			if (this.playerCurrent.nowPlaying !== this.playerCurrent.queue.length - 1) {
				++this.playerCurrent.nowPlaying
				this.togglePlayState(true)
			}
		},
		changeQueueIndex(index) {
			this.playerCurrent.nowPlaying = index
			this.togglePlayState(true)
		},
		showArtistSongs(artist) {
			this.songDetailsList = this.fetchedSongs.filter(song => song.artist.split(", ").includes(artist))
			this.tab = "Home"
			this.currentArtist = artist
		},
		newPlaylist() {
			let playlistName = `Playlist ${Object.keys(this.playlistsObject).length}`;
			this.playlistsObject[playlistName] = []
			this.updateLocalStorage()
		},
		selectPlaylist(name) {
			this.selectedPlaylist = {
				name: name,
				songs: this.playlistsObject[name].map(songID => this.songDetailsList.filter(song => song.id === songID)[0])
			}
		},
		playPlaylist(name) {
			if (!this.selectedPlaylist.songs.length)
				return
			this.playerCurrent.queue = this.selectedPlaylist.songs
			this.togglePlayState(true)
		},
		changeSongPosition(index, boolUp) {
			let pos = index + (boolUp? -1: 1);
			if (pos < 0 || pos === this.selectedPlaylist.songs.length)
				return
			[this.selectedPlaylist.songs[index], this.selectedPlaylist.songs[pos]] = [this.selectedPlaylist.songs[pos], this.selectedPlaylist.songs[index]]
			this.playlistsObject[this.selectedPlaylist.name] = this.selectedPlaylist.songs.map(song => song.id)
			this.updateLocalStorage()
			console.log(this.playlistsObject)
		},
		removeFromPlaylist(id) {
			let name = this.selectedPlaylist.name
			let songs = this.playlistsObject[name].filter(songID => songID !== id)
			this.playlistsObject[name] = songs
			this.selectedPlaylist.songs = songs
			this.updateLocalStorage()
			this.selectTab("Playlist")
			this.selectPlaylist(name)
		},
		getPlaylistName(currentName) {
			let newName = prompt("Enter New Name")
			if (!newName || !newName.trim())
				return
			this.selectedPlaylist.name = newName.trim()
			this.playlistsObject[newName] = this.playlistsObject[currentName]
			delete this.playlistsObject[currentName]
			this.updateLocalStorage()
		},
		deletingPlaylist(name) {
			this.selectTab("Playlist")
			delete this.playlistsObject[name]
			this.updateLocalStorage()
		}
	},
	template: `
		<navbar :selected="tab" :items="menuItems" @changeTab="selectTab" />
		<songs v-if="tab==='Home'" :songList="songDetailsList" :artist="currentArtist" @songSelected="startSong" @addSongToQueue="addToQueue" @playSongNext="playNext" @addSongToPlaylist="openPopUp" />
		<artists v-else-if="tab==='Artist'" :artristList="artistsList" @selectArtist="showArtistSongs" />
		<playlists v-else :playlistObj="playlistsObject" :selectedPlaylist="selectedPlaylist" @creatingPlaylist="newPlaylist" @selectingPlaylist="selectPlaylist" @removePlaylist="deletingPlaylist" @deleteFromPlaylist="removeFromPlaylist" @playingPlaylist="playPlaylist" @moveSong="changeSongPosition" @renamePlaylist="getPlaylistName" />
		<music-player :miniPlayer="true" :playerData="playerCurrent" @changePlayState="togglePlayState" @removeFromQueue="deleteFromQueue" @prevSong="playPreviousSong" @nextSong="playNextSong" @changeSong="changeQueueIndex" :songTimes="playerCurrent.time" />
		<music-player :playerData="playerCurrent" @changePlayState="togglePlayState" @removeFromQueue="deleteFromQueue" @prevSong="playPreviousSong" @nextSong="playNextSong" @changeSong="changeQueueIndex" :songTimes="playerCurrent.time" />
		<pop-up :playlists="Object.keys(playlistsObject)" v-if="showPopUp" @selectedPlaylistToAdd="selectPlaylistToAddSong" @cancel="closePopUp" />
		<loading v-if="isLoading" />
	`
})


app.component("navbar", {
	props: ["selected", "items"],
	template: `
		<nav>
			<h1>Melodify</h1>
			<ul>
			<nav-item v-for="item in items" :navItem="item" :class="(selected===item.text)?'nav-li-selected':''" @click="this.$emit('changeTab', item.text)" />
			</ul>
		</nav>
	`
})

app.component("nav-item", {
	props: ["navItem"],
	template: `
		<li>
			<i class="fa-solid" :class="'fa-'+navItem.icon"></i>
			<a>{{navItem.text}}</a>
		</li>
	`
})


app.component("songs", {
	data() {
		return {
			selectedSong: ''
		}
	},
	methods: {
		showMenu(song) {
			if (this.selectedSong === song)
				return this.selectedSong = ''
			this.selectedSong = song
		}
	},
	props: ["songList", "artist"],
	template: `
		<div class="songs main-container">
			<h2 class="main-h2">
				Songs
				<template v-if="artist !== null">by {{artist}}</template>
			</h2>
			<div class="list-container song-list">
				<song v-for="song in songList" :songDetails="song" :isSelectedSong="selectedSong === song.id" @openMenu="showMenu" @playSong="id => this.$emit('songSelected', id)" @addToQueue="id => this.$emit('addSongToQueue', id)" @playNext="id => this.$emit('playSongNext', id)" @addToPlaylist="id => this.$emit('addSongToPlaylist', id)" />
			</div>
		</div>
	`
})

app.component("song", {
	props: ["songDetails", "isSelectedSong"],
	emits: ["openMenu", "playSong", "playNext", "addToQueue", "addToPlaylist"],
	methods: {
		menuClick(id='') {
			this.$emit("openMenu", id)
		},
		playSong(id) {
			this.$emit("playSong", id)
			this.menuClick()
		},
		playSongNext(id) {
			this.$emit("playNext", id)
			this.menuClick()
		},
		addToQueue(id) {
			this.$emit("addToQueue", id)
			this.menuClick()
		},
		addToPlayList(id) {
			this.$emit("addToPlaylist", id)
			this.menuClick()
		}
	},
	template: `
		<div class="song-card">
			<img :src="songDetails.cover" :alt="songDetails.name">
			<div>
				<strong-span :strong="songDetails.name" :span="songDetails.artist" />
				<i class="fa-solid fa-ellipsis-vertical" @click="menuClick(songDetails.id)"></i>
			</div>
			<i class="fa-solid fa-circle-play" @click="playSong(songDetails.id)"></i>
			<div v-if="isSelectedSong" class="song-options">
				<button @click="playSongNext(songDetails.id)">Play Next</button>
				<button @click="addToQueue(songDetails.id)">Add to Queue</button>
				<button @click="addToPlayList(songDetails.id)">Add to Playlist</button>
			</div>
		</div>
	`
})


app.component("music-player", {
	data() {
		return {
			showPlayer: false,
			landscapeQueue: false
		}
	},
	methods: {
		toggleShowPlayer() {
			this.showPlayer = !this.showPlayer
		}
	},
	props: ["playerData", "miniPlayer", "songTimes"],
	template: `
		<div :class="miniPlayer?'portrait-music-player':'landscape-music-player'" v-if="playerData.queue[playerData.nowPlaying]">
			<div class="music-player" v-show="showPlayer">
				<i class="fa-solid fa-xmark" @click="toggleShowPlayer"></i>
				<div id="current_playing">
					<img :src="playerData.queue[playerData.nowPlaying].cover" :alt="playerData.queue[playerData.nowPlaying].name">
					<strong-span :strong="playerData.queue[playerData.nowPlaying].name" :span="playerData.queue[playerData.nowPlaying].artist" />
					<progress :value="songTimes.now" :max="songTimes.end"></progress>
				</div>
				<div class="controls">
					<i class="fa-solid fa-backward-step" @click="this.$emit('prevSong')"></i>
					<i class="fa-solid" :class="playerData.playing?'fa-circle-pause':' fa-circle-play'" @click="this.$emit('changePlayState')"></i>
					<i class="fa-solid fa-forward-step" @click="this.$emit('nextSong')"></i>
				</div>
				<i class="fa-solid fa-list" v-if="!miniPlayer" @click="landscapeQueue = !landscapeQueue"></i>
				<div class="queue" :class="landscapeQueue?'landscape-queue':''">
					<template v-for="(queueItem, index) in playerData.queue">
						<div class="song" v-show="index > playerData.nowPlaying" @click="this.$emit('changeSong', index)">
							<img :src="queueItem.cover" :alt="queueItem.name">
							<strong-span :strong="queueItem.name" :span="queueItem.artist" />
							<button @click.stop="this.$emit('removeFromQueue', index)"><i class="fa-solid fa-xmark"></i></button>
						</div>
					</template>
				</div>
			</div>
			<mini-music-player v-if="miniPlayer" :nowPlaying="playerData.queue[playerData.nowPlaying]" :playing="playerData.playing" @click="toggleShowPlayer" @togglePlay="() => this.$emit('changePlayState')" />
		</div>
	`
})

app.component("mini-music-player", {
	methods: {
		togglePlay(playing) {
			playing = !playing
			this.$emit('togglePlay')
		}
	},
	props: ["nowPlaying", "playing"],
	template: `
		<div class="mini-music-player">
			<img :src="nowPlaying.cover" :alt="nowPlaying.name">
			<strong-span :strong="nowPlaying.name" :span="nowPlaying.artist" />
			<button @click.stop="togglePlay(playing)">
				<i class="fa-solid" :class="playing?'fa-pause':'fa-play'"></i>
			</button>
		</div>
	`
})

app.component("artists", {
	props: ["artristList"],
	template: `
		<div class="artists main-container">
			<h2 class="main-h2">Artists</h2>
			<div class="list-container artists-list">
				<div v-for="artist in artristList" class="artist-card" @click="this.$emit('selectArtist', artist.name)" >
					<img :src="artist.image" :alt="artist.name">
					<h3>{{artist.name}}</h3>
				</div>
			</div>
		</div>
	`
})

app.component("playlists", {
	props: ["playlistObj", "selectedPlaylist"],
	template: `
		<div class="playlists main-container">
			<playlistList v-if="selectedPlaylist === null" :playlistObject="playlistObj" @createPlaylist="() => this.$emit('creatingPlaylist')" @selectPlaylist="playlistName => this.$emit('selectingPlaylist', playlistName)" />
			<showPlaylist v-else :playlist="selectedPlaylist" @deletePlaylist="name => this.$emit('removePlaylist', name)" @deleteSong="id => this.$emit('deleteFromPlaylist', id)" @playPlaylist="name => this.$emit('playingPlaylist', name)" @changePosition="(index, boolUp) => this.$emit('moveSong', index, boolUp)" @changePlaylistName="current => this.$emit('renamePlaylist', current)" />
		</div>
	`
})

app.component("playlistList", {
	props: ["playlistObject"],
	emits: ["createPlaylist", "selectPlaylist"],
	template: `
		<h2 class="main-h2">Playlist</h2>
		<div class="list-container playlist-list">
			<strong-span class="playlist-item" v-for="[playlistName, songList] in Object.entries(playlistObject)" :strong="playlistName" :span="songList.length+' Songs'" @click="this.$emit('selectPlaylist', playlistName)" />
			<div class="new-playlist-btn" @click="this.$emit('createPlaylist')">
				<i class="fa-solid fa-plus"></i>
				<span>Add New</span>
			</div>
		</div>
	`
})

app.component("showPlaylist", {
	props: ["playlist"],
	template: `
		<div class="playlist">
			<div class="header">
				<div class="playlist-name">
					<strong-span :strong="playlist.name" :span="playlist.songs.length + ' Songs'" />
					<i class="fa-solid fa-edit" @click="this.$emit('changePlaylistName', playlist.name)"></i>
				</div>
				<i class="fa-solid fa-circle-play" @click="this.$emit('playPlaylist', playlist.name)"></i>
			</div>
			<div class="playlist-songs">
				<template v-for="(song, index) in playlist.songs">
					<div class="song">
						<div>
							<img :src="song.cover" :alt="song.name">
							<strong-span :strong="song.name" :span="song.artist" />
						</div>
						<div>
							<div>
								<i class="fa-solid fa-caret-up" @click="this.$emit('changePosition', index, true)"></i>
								<i class="fa-solid fa-caret-down" @click="this.$emit('changePosition', index, false)"></i>
							</div>
							<i class="fa-solid fa-xmark" @click="this.$emit('deleteSong', song.id)"></i>
						</div>
					</div>	
				</template>
			</div>
			<button @click="this.$emit('deletePlaylist', playlist.name)">
				<i class="fa-solid fa-trash"></i>
				Delete Playlist
			</button>
		</div>
	`
})


app.component("pop-up", {
	data() {
		return {
			playlistName: ''
		}
	},
	methods: {
		changeOption(event) {
			this.playlistName = event.target.value
		},
		selectingPlaylist() {
			let playlistName = this.playlistName
			if (playlistName !== '')
				this.$emit("selectedPlaylistToAdd", playlistName)
		}
	},
	props: ["playlists"],
	template: `
		<div class="pop-up">
			<select @change="changeOption">
				<option value="" selected>Select Play list</option>
				<option v-for="playlist in playlists" :value="playlist">{{playlist}}</option>
			</select>
			<div class="options">
				<button @click="selectingPlaylist">Done</button>
				<button @click="this.$emit('cancel')">Cancel</button>
			</div>
		</div>
	`
})


app.component("strong-span", {
	props:["strong", "span"],
	template: `
		<div class="details">
			<strong>{{strong}}</strong>
			<span>{{span}}</span>
		</div>
	`
})


app.component("loading", {
	template: `
		<div class="loader">
			<div v-for="i in 5"></div>
		</div>
	`
})


app.mount('#app')