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
      showReasonInput: false,
      returnReason: "",
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
    confirmReturn() {
      if (this.returnReason.trim()) {
        this.$emit("move-back", { card: this.card, reason: this.returnReason });
        this.showReasonInput = false;
        this.returnReason = "";
      }
    },
  },
  computed: {
    isOverdue() {
      if (this.columnType !== "col4") return false;
      const today = new Date();
      const deadline = new Date(this.card.deadline);
      return today > deadline;
    },
  },
  template: `
    <div class="card" :class="{ overdue: isOverdue }">
      <div style="display: flex; justify-content: space-between;">
        <span>
          {{ card.createdDate }}
          <span v-if="card.editedDate">(ред)</span>
        </span>
        <button v-if="columnType === 'col1'" @click="$emit('delete-card')">Удалить</button>
      </div>

      <template v-if="!isEditing && !showReasonInput">
        <div v-if="columnType === 'col4'" class="status-badge" :class="{ overdue: isOverdue }">
          {{ isOverdue ? 'Просрочена' : 'Завершена в срок' }}
        </div>

        <h3>{{ card.title }}</h3>
        <p>{{ card.description }}</p>
        <div>Дедлайн: {{ card.deadline }}</div>

        <div v-if="card.returnReason && columnType=='col2'" style="background: rgba(255, 131, 131, 0.67); padding: 5px; margin: 5px 0;">
          Причина: {{ card.returnReason }}
        </div>

        <div style="display: flex; gap: 5px; margin-top: 8px;">
          <button v-if="columnType !== 'col4'" @click="startEdit">Редактировать</button>

          <template v-if="columnType === 'col1'">
            <button @click="$emit('move-forward')">Переместить дальше</button>
          </template>

          <template v-else-if="columnType === 'col2'">
            <button @click="$emit('move-forward')">Переместить дальше</button>
          </template>

          <template v-else-if="columnType === 'col3'">
            <button @click="$emit('move-forward')">Завершить задачу</button>
            <button @click="showReasonInput = true">Вернуть в разработку</button>
          </template>
        </div>
      </template>

      <template v-else-if="showReasonInput">
        <textarea v-model="returnReason" placeholder="Причина возврата..."></textarea>
        <div>
          <button @click="confirmReturn">Ок</button>
          <button @click="showReasonInput = false">Отмена</button>
        </div>
      </template>

      <template v-else>
        <input v-model="editedTitle" placeholder="Заголовок">
        <textarea v-model="editedDescription" placeholder="Описание"></textarea>
        <input type="date" v-model="editedDeadline">
        <div>
          <button @click="saveEdit">Ок</button>
          <button @click="cancelEdit">Отмена</button>
        </div>
      </template>
    </div>
  `,
});

Vue.component("board-column", {
  props: {
    title: String,
    cards: Array,
    columnType: String,
    onAddCard: Function,
    onDeleteCard: Function,
    onMoveForward: Function,
    onMoveBack: Function,
    onCardUpdated: Function,
  },
  components: {
    "add-button": Vue.options.components["add-button"],
    card: Vue.options.components["card"],
  },
  template: `
    <div class="column">
      <h2>{{ title }}</h2>
      <add-button
        v-if="columnType === 'col1'"
        @click="onAddCard ? onAddCard() : null"
      />
      <div class="cards">
        <card
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :column-type="columnType"
          @delete-card="onDeleteCard ? onDeleteCard(card) : null"
          @move-forward="onMoveForward ? onMoveForward(card) : null"
          @move-back="onMoveBack ? onMoveBack($event) : null"
          @card-updated="onCardUpdated ? onCardUpdated() : null"
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
          v-for="col in columns"
          :key="col.type"
          :title="col.title"
          :cards="getCards(col.type)"
          :column-type="col.type"
          :on-add-card="col.type === 'col1' ? addCard : null"
          :on-delete-card="col.type === 'col1' ? deleteCard : null"
          :on-move-forward="getMoveForward(col.type)"
          :on-move-back="col.type === 'col3' ? moveToCol2WithReason : null"
          :on-card-updated="saveToLocalStorage"
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
    columns: [
      { title: "Запланированные", type: "col1" },
      { title: "В работе", type: "col2" },
      { title: "Тестирование", type: "col3" },
      { title: "Выполненные", type: "col4" },
    ],
  },
  watch: {
    col1: { handler: "saveToLocalStorage", deep: true },
    col2: { handler: "saveToLocalStorage", deep: true },
    col3: { handler: "saveToLocalStorage", deep: true },
    col4: { handler: "saveToLocalStorage", deep: true },
  },
  mounted() {
    const saved = localStorage.getItem("kanban-data");
    if (saved) {
      const data = JSON.parse(saved);
      this.col1 = data.col1 || [];
      this.col2 = data.col2 || [];
      this.col3 = data.col3 || [];
      this.col4 = data.col4 || [];
      this.nextId = data.nextId || 1;
    }
  },
  methods: {
    getCards(type) {
      return this[type];
    },
    getMoveForward(type) {
      const map = {
        col1: this.moveToCol2,
        col2: this.moveToCol3,
        col3: this.moveToCol4,
      };
      return map[type] || null;
    },
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
    moveToCol2WithReason(data) {
      const index = this.col3.findIndex((c) => c.id === data.card.id);
      if (index !== -1) {
        data.card.returnReason = data.reason;
        this.col3.splice(index, 1);
        this.col2.push(data.card);
      }
    },
    saveToLocalStorage() {
      const data = {
        col1: this.col1,
        col2: this.col2,
        col3: this.col3,
        col4: this.col4,
        nextId: this.nextId,
      };
      localStorage.setItem("kanban-data", JSON.stringify(data));
    },
  },
});
