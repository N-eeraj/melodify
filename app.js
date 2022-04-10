const app = Vue.createApp({
    data() {
        return {
            tab: "Home",
            menuItems: [],
            songDetailsList: [],
            fetchedData: {},
            playerCurrent: {
                nowPlaying: {},
                playing: false,          
                queue: [],
                queueIndex: 0
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
            this.playerCurrent.nowPlaying = fetchedData.songs[0]
            for (let i=0; i<5; i++)
                this.playerCurrent.queue.push(fetchedData.songs[i])
        })
    },
    methods: {
        selectTab(tab) {
            this.tab = tab
        },
        startSong(id) {
            this.playerCurrent.nowPlaying = this.songDetailsList.filter(song => song.id === id)[0]
            this.playerCurrent.playing = true
        },
        deleteFromQueue(id) {
            this.playerCurrent.queue = this.playerCurrent.queue.filter(song => song.id !== id)
        }
    },
    template: `
        <navbar :selected="tab" :items="menuItems" @changeTab="selectTab" />
        <songs v-if="tab==='Home'" :songList="songDetailsList" @songSelected="startSong" />
        <music-player :miniPlayer="true" :playerData="playerCurrent" @changePlayState="playerCurrent.playing = !playerCurrent.playing" @removeFromQueue="deleteFromQueue" />
        <music-player :playerData="playerCurrent" />
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
                <song v-for="song in songList" :songDetails="song" :isSelectedSong="selectedSong === song.id" @openMenu="showMenu" @playSong="id => this.$emit('songSelected', id)" />
            </div>
        </div>
    `
})

app.component("song", {
    props: ["songDetails", "isSelectedSong"],
    emits: ["openMenu", "playSong"],
    methods: {
        menuClick(id='') {
            this.$emit("openMenu", id)
        },
        playSong(id) {
            this.$emit("playSong", id)
            this.menuClick()
        },
        playSongNext(id) {
            console.log(id)
            this.menuClick()
        },
        addToQueue(id) {
            console.log(id)
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
            showPlayer: false
        }
    },
    methods: {
        toggleShowPlayer() {
            this.showPlayer = !this.showPlayer
        }
    },
    props: ["playerData", "miniPlayer"],
    template: `
        <div :class="miniPlayer?'portrait-music-player':'landscape-music-player'">
            <div class="music-player" v-show="showPlayer">
                <i class="fa-solid fa-xmark" @click="toggleShowPlayer"></i>
                <div id="current_playing">
                    <img :src="playerData.nowPlaying.cover" :alt="playerData.nowPlaying.name">
                    <songDetails :songName="playerData.nowPlaying.name" :artistName="playerData.nowPlaying.artist" />
                </div>
                <div class="controls">
                    <i class="fa-solid fa-backward-step"></i>
                    <i class="fa-solid" :class="playerData.playing?'fa-circle-pause':' fa-circle-play'" @click="this.$emit('changePlayState')"></i>
                    <i class="fa-solid fa-forward-step"></i>
                </div>
                <div class="queue">
                    <div class="song" v-for="queueItem in playerData.queue.slice(1)">
                        <img :src="queueItem.cover" :alt="queueItem.name">
                        <songDetails :songName="queueItem.name" :artistName="queueItem.artist" />
                        <button @click="this.$emit('removeFromQueue', queueItem.id)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>
            <mini-music-player v-if="miniPlayer" :nowPlaying="playerData.nowPlaying" :playing="playerData.playing" @click="toggleShowPlayer" @togglePlay="() => this.$emit('changePlayState')" />
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