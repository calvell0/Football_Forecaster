let gameData = {}; // Object to store games grouped by date

function fetchAndPopulateCalendar() {
    fetch('/events/schedule')
        .then(response => response.json())
        .then(games => {
            console.log("Fetched Games:", games);

            if (Array.isArray(games)) {

                gameData = {};


                games.forEach(game => {
                    const gameDate = new Date(game.date);

                    gameDate.setHours(gameDate.getHours() - 5);


                    const formattedDate = gameDate.toISOString().split('T')[0];


                    const homeTeamId = game.homeTeam.id;
                    const awayTeamId = game.awayTeam.id;

                    if (!gameData[formattedDate]) {
                        gameData[formattedDate] = [];
                    }
                    gameData[formattedDate].push({
                        homeTeam: { id: homeTeamId, displayName: game.homeTeam.displayName },
                        awayTeam: { id: awayTeamId, displayName: game.awayTeam.displayName },
                        gameDate: gameDate,
                        gameId: game.id
                    });
                });

                console.log("Game Data by Date:", gameData);

                flatpickr("#game-date", {
                    enableTime: false,
                    dateFormat: "Y-m-d",
                    onDayCreate: function(dObj, dStr, fp, dayElem) {
                        const date = dayElem.dateObj;
                        const dateString = date.toISOString().split('T')[0];

                        // Highlight days that have games
                        if (gameData[dateString]) {
                            dayElem.classList.add("has-games");
                            dayElem.addEventListener('click', () => {
                                showGameDetails(dateString);
                            });
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error fetching future games:", error);
        });
}


// Show game details for the selected date
function showGameDetails(date) {
    const gameListElement = document.getElementById('game-list');
    gameListElement.innerHTML = '';

    const gamesForDate = gameData[date];

    if (gamesForDate && gamesForDate.length > 0) {
        gameListElement.style.display = 'block';

        gamesForDate.forEach(game => {
            const gameElement = document.createElement('div');
            gameElement.classList.add('game-item');
            gameElement.textContent = `${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`;


            gameElement.addEventListener('click', () => {
                const homeTeamId = game.homeTeam.id;
                const awayTeamId = game.awayTeam.id;
                window.location.href = `/prediction?home=${homeTeamId}&away=${awayTeamId}`;
            });

            gameListElement.appendChild(gameElement);
        });
    } else {
        gameListElement.style.display = 'none';
    }
}


document.addEventListener('DOMContentLoaded', fetchAndPopulateCalendar);




function findGameDates() {
    // Get the values from the search bars
    const awayName = document.getElementById('query').value;
    const homeName = document.getElementById('query2').value;
    const awayId = document.getElementById('query').getAttribute('data-id');
    const homeId = document.getElementById('query2').getAttribute('data-id');
    const awayAbbrv = document.getElementById('query').getAttribute('short');
    const homeAbbrv = document.getElementById('query2').getAttribute('short');
    let shortName = "";

    if (awayName && homeName) {
        shortName = awayAbbrv + " @ " + homeAbbrv;
    }

    console.log("Team 1 Name: " + awayName + " team1 id: " + awayId + " abv: " + awayAbbrv);
    console.log("Team 2 Name: " + homeName + " team2 id: " + homeId + " abv: " + homeAbbrv);
    console.log(shortName);

    // First fetch attempt with initial homeTeamId and awayTeamId
    fetch(`/events?homeId=${homeId}&awayId=${awayId}`)
        .then(async response => {
            return {
                status: response.status,
                data: await response.json()
            }
        })
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                //TODO: the /events endpoint now returns a list of events matching both team ids
                //TODO: maybe change this to select multiple dates if multiple events are returned
                console.log("date:", response.data[0].date);
                const gameDate = response.data[0].date;
                const calendarInput = document.getElementById('game-date');
                calendarInput.value = gameDate;


                // Reinitialize Flatpickr to make sure it's set to the selected date
                flatpickr("#game-date", {
                    defaultDate: gameDate,
                    enableTime: false,
                    dateFormat: "Y-m-d",
                    onChange: function(selectedDates, dateStr, instance) {
                        // Navigate to prediction.html with the selected date as a query parameter
                        window.location.href = `/prediction?home=${homeId}&away=${awayId}`;
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error finding game date:", error);
            alert("There was an error finding the game date.");
        });
}
flatpickr("#game-date", {
    enableTime: false,
    dateFormat: "Y-m-d",
});




// Close dropdowns if clicked outside
document.addEventListener("click", function (e) {
    const dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach(dropdown => {
        const isClickInsideDropdown = dropdown.contains(e.target);
        const isClickOnButton = e.target.closest(".dropbtn");

        if (!isClickInsideDropdown && !isClickOnButton) {
            dropdown.style.display = "none"; // Hide the dropdown if clicked outside
        }
    });
});




function toggleDropdown(event, dropdownId) {
    event.preventDefault(); // Prevent the default button behavior
    const dropdown = document.getElementById(dropdownId);


    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }
}
