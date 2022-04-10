const app = Vue.createApp({
    data() {
        return {
            tab: "Home",
            menuItems: null,
            songDetailsList: [],
            fetchedData: null,
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
        })
    },
    methods: {
        selectTab(tab) {
            this.tab = tab
        }
    },
    template: `
        <navbar :selected="tab" :items="menuItems" @changeTab="selectTab" />
        <songs v-if="tab==='Home'" :songList="songDetailsList" />
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
                <song v-for="song in songList" :songDetails="song" :isSelectedSong="selectedSong === song.id" @openMenu="showMenu" />
            </div>
        </div>
    `
})

app.component("song", {
    props: ["songDetails", "isSelectedSong"],
    emits: ["openMenu"],
    methods: {
        menuClick(id='') {
            this.$emit('openMenu', id)
        },
        playSong(id) {
            console.log(id)
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
            <img :src="songDetails.cover" alt="songDetails.name">
            <div>
                <div>
                    <strong>{{songDetails.name}}</strong>
                    <span>{{songDetails.artist}}</span>
                </div>
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

app.component("loading", {
    template: `
        <div class="loader">
            <div v-for="i in 5"></div>
        </div>
    `
})

app.mount('#app')