Vue.component("add-button", {
  props: ["disabled"],
  template: `
        <button
            @click="$emit('click')"
            :disabled="disabled"
        >+ Добавить</button>
    `,
});

Vue.component("card", {
  props: ["card"],
  template: `
        <div class="card">
            <div>{{ card.createdDate }}</div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div>Дедлайн: {{ card.deadline }}</div>
        </div>
    `,
});

Vue.component("board-column", {
  props: ["title", "cards", "columnType"],
  components: {
    "add-button": Vue.options.components["add-button"],
    card: Vue.options.components["card"],
  },
  template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <add-button
                v-if="columnType === 'col1'"
                @click="$emit('add-card')"
            />
            <div class="cards">
                <card
                    v-for="card in cards"
                    :key="card.id"
                    :card="card"
                />
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
                    @add-card="addCard"
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
  methods: {
    addCard() {
      const now = new Date();
      const newCard = {
        id: this.nextId++,
        title: "Новая задача",
        description: "Описание",
        deadline: now.toISOString().split("T")[0],
        createdDate: now.toLocaleDateString(),
        editedDate: null,
        returnReason: null,
      };
      this.col1.push(newCard);
    },
  },
});
