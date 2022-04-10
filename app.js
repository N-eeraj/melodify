const app = Vue.createApp({
    data() {
        return {
            tab: "Home",
            menuItems: [],
            songDetailsList: [],
            fetchedData: {},
            playerCurrent: {
                nowPlaying: 0,
                playing: false,          
                queue: []
            },
            playlists: [],
            isLoading: true,
        }
    },
    beforeCreate() {
        fetch("http://localhost:5500/data.json")
        .then(response => response.json())
        .then(data => {
            let fetchedData = this.fetchedData
            this.isLoading = false
            fetchedData = data
            this.menuItems = fetchedData.menuItems
            fetchedData.songs.forEach(song => {
                this.songDetailsList.push(song)
            })
            for (let i=0; i<5; i++)
                this.playerCurrent.queue.push(fetchedData.songs[i])
            this.playerCurrent.nowPlaying = 0
        })
    },
    methods: {
        selectTab(tab) {
            this.tab = tab
        },
        togglePlayState(play=false) {
            if (play)
                return this.playerCurrent.playing = true
            this.playerCurrent.playing = !this.playerCurrent.playing
        },
        startSong(id) {
            this.playerCurrent.nowPlaying = 0
            this.playerCurrent.queue = [this.songDetailsList.filter(song => song.id === id)[0]]
            this.playerCurrent.playing = true
        },
        playNext(id){
            let song = this.songDetailsList.filter(song => song.id === id)[0]
            this.playerCurrent.queue.splice(1, 0, song)
        }, 
        addToQueue(id){
            let song = this.songDetailsList.filter(song => song.id === id)[0]
            this.playerCurrent.queue.push(song)
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
        }
    },
    template: `
        <navbar :selected="tab" :items="menuItems" @changeTab="selectTab" />
        <songs v-if="tab==='Home'" :songList="songDetailsList" @songSelected="startSong" @addSongToQueue="addToQueue" @playSongNext="playNext" />
        <music-player :miniPlayer="true" :playerData="playerCurrent" @changePlayState="togglePlayState" @removeFromQueue="deleteFromQueue" @prevSong="playPreviousSong" @nextSong="playNextSong" />
        <music-player :playerData="playerCurrent" @changePlayState="togglePlayState" @removeFromQueue="deleteFromQueue" @prevSong="playPreviousSong" @nextSong="playNextSong" />
        <loading v-if="isLoading" />
    `
})


app.component("navbar", {
    props: ["selected", "items"],
    template: `
        <nav>
            <h1>Songify</h1>
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
    props: ["songList"],
    template: `
        <div class="songs">
            <h2>Songs</h2>
            <div class="song-list">
                <song v-for="song in songList" :songDetails="song" :isSelectedSong="selectedSong === song.id" @openMenu="showMenu" @playSong="id => this.$emit('songSelected', id)" @addToQueue="id => this.$emit('addSongToQueue', id)" @playNext="id => this.$emit('playSongNext', id)" />
            </div>
        </div>
    `
})

app.component("song", {
    props: ["songDetails", "isSelectedSong"],
    emits: ["openMenu", "playSong", "playNext", "addToQueue"],
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
            console.log(id)
            this.menuClick()
        }
    },
    template: `
        <div class="song-card">
            <img :src="songDetails.cover" :alt="songDetails.name">
            <div>
                <songDetails :songName="songDetails.name" :artistName="songDetails.artist" />
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
    props: ["playerData", "miniPlayer"],
    template: `
        <div :class="miniPlayer?'portrait-music-player':'landscape-music-player'" v-if="playerData.queue[playerData.nowPlaying]">
            <div class="music-player" v-show="showPlayer">
                <i class="fa-solid fa-xmark" @click="toggleShowPlayer"></i>
                <div id="current_playing">
                    <img :src="playerData.queue[playerData.nowPlaying].cover" :alt="playerData.queue[playerData.nowPlaying].name">
                    <songDetails :songName="playerData.queue[playerData.nowPlaying].name" :artistName="playerData.queue[playerData.nowPlaying].artist" />
                    <progress value="50" max="100"></progress>
                </div>
                <div class="controls">
                    <i class="fa-solid fa-backward-step" @click="this.$emit('prevSong')"></i>
                    <i class="fa-solid" :class="playerData.playing?'fa-circle-pause':' fa-circle-play'" @click="this.$emit('changePlayState')"></i>
                    <i class="fa-solid fa-forward-step" @click="this.$emit('nextSong')"></i>
                </div>
                <i class="fa-solid fa-list" v-if="!miniPlayer" @click="landscapeQueue = !landscapeQueue"></i>
                <div class="queue" :class="landscapeQueue?'landscape-queue':''">
                    <template v-for="(queueItem, index) in playerData.queue">
                        <div class="song" v-show="index > playerData.nowPlaying">
                            <img :src="queueItem.cover" :alt="queueItem.name">
                            <songDetails :songName="queueItem.name" :artistName="queueItem.artist" />
                            <button @click="this.$emit('removeFromQueue', index)"><i class="fa-solid fa-xmark"></i></button>
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
            <songDetails :songName="nowPlaying.name" :artistName="nowPlaying.artist" />
            <button @click.stop="togglePlay(playing)">
                <i class="fa-solid" :class="playing?'fa-pause':'fa-play'"></i>
            </button>
        </div>
    `
})


app.component("songDetails", {
    props:["songName", "artistName"],
    template: `
        <div class="details">
            <strong>{{songName}}</strong>
            <span>{{artistName}}</span>
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