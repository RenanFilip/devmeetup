import * as firebase from 'firebase'

export default {
    state: {
        loadedMeetups: [
            { 
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/47/New_york_times_square-terabass.jpg', 
                id: 'iuahsauihsuah323', 
                title: 'Meetup in New York',
                date: new Date(),
                location: 'New York',
                description: 'New York, New York!'
            },
            { 
                imageUrl: 'https://res.cloudinary.com/adagio/image/upload/s--xolGOkXO--/c_thumb%2Cf_auto%2Cg_center%2Ch_600%2Cq_auto%2Cw_975/v1/destinations/France/03_Photo_villes/Paris_la_Defense/Paris_La-defense-grand-arche3800x2500.jpg?itok=pwzjijWU', 
                id: 'nxbcmzxbczmnxzbc323', 
                title: 'Meetup in Paris',
                date: new Date(),
                location: 'Paris',
                description: 'It\'s Paris!'
            }
        ]
    },
    mutations: {
      setLoadedMeetups (state, payload) {
        state.loadedMeetups = payload
      },
      createMeetup (state, payload) {
        state.loadedMeetups.push(payload)
      },
      updateMeetup (state, payload) {
        const meetup = state.loadedMeetups.find(meetup => {
            return meetup.id === payload.id
        })
        if (payload.title) {
            meetup.title = payload.title
        }
        if (payload.description) {
            meetup.description = payload.description
        }
        if (payload.date) {
            meetup.date = payload.date
        }
      }
    },
    actions: {
      loadMeetups({commit}) {
        commit('setLoading', true)
        firebase.database().ref('meetups').once('value')
            .then((data) => {
                const meetups = []
                const obj = data.val()
                for (let key in obj) {
                    meetups.push({
                        id: key,
                        title: obj[key].title,
                        description: obj[key].description,
                        imageUrl: obj[key].imageUrl,
                        date: obj[key].date,
                        location: obj[key].location,
                        creatorId: obj[key].creatorId
                    })
                }
                commit('setLoadedMeetups', meetups)
                commit('setLoading', false)
            })
            .catch(
                (error) => {
                    console.log(error)
                    commit('setLoading', true)
                }
            )
      },
      createMeetup ({commit, getters}, payload) {
        const meetup = {
          title: payload.title,
          location: payload.location,
          description: payload.description,
          date: payload.date.toISOString(),
          creatorId: getters.user.id
        }
        let imageUrl
        let key
        let ext
        firebase.database().ref('meetups').push(meetup)
            .then((data) => {
                key = data.key
                return key
            })
            .then(key => {
                const filename = payload.image.name
                ext = filename.slice(filename.lastIndexOf('.'))
                return firebase.storage().ref('meetups/' + key +  '.' + ext).put(payload.image)
            })
            .then(fileData => {
                console.log(key)
                console.log(fileData)
                return firebase.storage().ref('meetups/' + key + '.' + ext).getDownloadURL()
            })
            .then(URL => {
                imageUrl = URL
                console.log(imageUrl)
                return firebase.database().ref('meetups').child(key).update({imageUrl: imageUrl})
            })
            .then(() => {
                commit('createMeetup', {
                    ...meetup,
                    id: key,
                    link: '/meetups/' + key,
                    imageUrl: imageUrl
                })
            })
            .catch((error) => {
                console.log(error)
            })
      },
      updateMeetupData ({commit}, payload) {
        commit('setLoading', true)
        const updateObj = {}
        if (payload.title) {
            updateObj.title = payload.title
        }
        if (payload.description) {
            updateObj.description = payload.description
        }
        if (payload.date) {
            updateObj.date = payload.date
        }
        firebase.database().ref('meetups').child(payload.id).update(updateObj)
            .then(() => {
                commit('setLoading', false)
                commit('updateMeetup', payload)
            })
            .catch(error => {
                console.log(error)
                commit('setLoading', false)
            })
      }
    },
    getters: {
        loadedMeetups (state) {
            return state.loadedMeetups.sort((meetupA, meetupB) => {
                return meetupA.date > meetupB.date
            })
        },
        featuredMeetups (state, getters) {
            return getters.loadedMeetups.slice(0, 5)
        },
        loadedMeetup (state) {
            return (meetupId) => {
                return state.loadedMeetups.find((meetup) => {
                    return meetup.id === meetupId
                })
            }
        }
    }
}
