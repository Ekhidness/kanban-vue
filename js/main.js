Vue.component("add-button", {
  props: ["disabled"],
  template: `
        <button @click="$emit('click')" :disabled="disabled">+ Добавить</button>
    `,
});

Vue.component("card", {
  props: ["card", "columnType"],
  data() {
    return {
      isEditing: false,
      editedTitle: "",
      editedDescription: "",
      editedDeadline: "",
    };
  },
  methods: {
    startEdit() {
      this.editedTitle = this.card.title;
      this.editedDescription = this.card.description;
      this.editedDeadline = this.card.deadline;
      this.isEditing = true;
    },
    saveEdit() {
      this.card.title = this.editedTitle;
      this.card.description = this.editedDescription;
      this.card.deadline = this.editedDeadline;
      this.card.editedDate = new Date().toLocaleString();
      this.isEditing = false;
      this.$emit("card-updated");
    },
    cancelEdit() {
      this.isEditing = false;
    },
  },
  template: `
        <div class="card">
            <div style="display: flex; justify-content: space-between;">
                <span>
                    {{ card.createdDate }}
                    <span v-if="card.editedDate">(ред)</span>
                </span>
                <button v-if="columnType === 'col1'" @click="$emit('delete-card')">✗</button>
            </div>

            <template v-if="!isEditing">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <div>{{ card.deadline }}</div>
                <div style="display: flex; gap: 5px; margin-top: 8px;">
                    <button @click="startEdit">✎</button>

                    <template v-if="columnType === 'col1'">
                        <button @click="$emit('move-forward')">→</button>
                    </template>

                    <template v-else-if="columnType === 'col2'">
                        <button @click="$emit('move-forward')">→</button>
                    </template>

                    <template v-else-if="columnType === 'col3'">
                        <button @click="$emit('move-forward')">→</button>
                    </template>
                </div>
            </template>

            <template v-else>
                <input v-model="editedTitle" placeholder="Заголовок">
                <textarea v-model="editedDescription" placeholder="Описание"></textarea>
                <input type="date" v-model="editedDeadline">
                <div>
                    <button @click="saveEdit">✓</button>
                    <button @click="cancelEdit">✗</button>
                </div>
            </template>
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
                    :column-type="columnType"
                    @delete-card="$emit('delete-card', card)"
                    @move-forward="$emit('move-forward', card)"
                    @card-updated="$emit('card-updated')"
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
                    @delete-card="deleteCard"
                    @move-forward="moveToCol2"
                    @card-updated="saveToLocalStorage"
                />
                <board-column
                    title="В работе"
                    :cards="col2"
                    column-type="col2"
                    @move-forward="moveToCol3"
                    @card-updated="saveToLocalStorage"
                />
                <board-column
                    title="Тестирование"
                    :cards="col3"
                    column-type="col3"
                    @move-forward="moveToCol4"
                    @card-updated="saveToLocalStorage"
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
    deleteCard(card) {
      const index = this.col1.findIndex((c) => c.id === card.id);
      if (index !== -1) this.col1.splice(index, 1);
    },
    moveToCol2(card) {
      const index = this.col1.findIndex((c) => c.id === card.id);
      if (index !== -1) {
        this.col1.splice(index, 1);
        this.col2.push(card);
      }
    },
    moveToCol3(card) {
      const index = this.col2.findIndex((c) => c.id === card.id);
      if (index !== -1) {
        this.col2.splice(index, 1);
        this.col3.push(card);
      }
    },
    moveToCol4(card) {
      const index = this.col3.findIndex((c) => c.id === card.id);
      if (index !== -1) {
        this.col3.splice(index, 1);
        this.col4.push(card);
      }
    },
    saveToLocalStorage() {},
  },
});
