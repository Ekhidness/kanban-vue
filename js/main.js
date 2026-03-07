Vue.component("board-column", {
  props: ["title", "cards", "columnType"],
  template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <div class="cards">
                <div v-for="card in cards" :key="card.id" class="card">
                    <h3>{{ card.title }}</h3>
                </div>
            </div>
        </div>
    `,
});

new Vue({
  el: "#app",
  template: `
        <div class="board">
            <h1>Kanban доска</h1>
            <div class="columns">
                <board-column
                    title="Запланированные"
                    :cards="col1"
                    column-type="col1"
                />
                <board-column
                    title="В работе"
                    :cards="col2"
                    column-type="col2"
                />
                <board-column
                    title="Тестирование"
                    :cards="col3"
                    column-type="col3"
                />
                <board-column
                    title="Выполненные"
                    :cards="col4"
                    column-type="col4"
                />
            </div>
        </div>
    `,
  data: {
    col1: [],
    col2: [],
    col3: [],
    col4: [],
    nextId: 1,
  },
});
