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
        this.animateAndEmit("move-back", {
          card: this.card,
          reason: this.returnReason,
        });
        this.showReasonInput = false;
        this.returnReason = "";
      }
    },
    animateMoveForward() {
      this.animateAndEmit("move-forward");
    },
    animateAndEmit(eventName, payload = null) {
      const element = this.$el;
      const rect = element.getBoundingClientRect();

      const clone = element.cloneNode(true);
      clone.classList.add("flying-card");
      clone.classList.remove("dragging");
      clone.style.position = "fixed";
      clone.style.left = rect.left + "px";
      clone.style.top = rect.top + "px";
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.margin = "0";
      clone.style.zIndex = "9999";
      clone.style.pointerEvents = "none";
      clone.style.transition =
        "all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)";

      document.body.appendChild(clone);

      element.style.opacity = "0";
      element.style.transform = "scale(0.8)";

      setTimeout(() => {
        const targetColumn = this.getTargetColumn();
        if (targetColumn) {
          const targetRect = targetColumn.getBoundingClientRect();
          const cardsContainer = targetColumn.querySelector(".cards");

          if (cardsContainer) {
            const containerRect = cardsContainer.getBoundingClientRect();
            const newLeft = containerRect.left + 10;
            const newTop = containerRect.top + containerRect.height - 20;

            clone.style.left = newLeft + "px";
            clone.style.top = newTop + "px";
            clone.style.transform = "scale(0.9) rotate(5deg)";
            clone.style.opacity = "0.7";
          }
        } else {
          clone.style.transform = "scale(0.5) rotate(180deg)";
          clone.style.opacity = "0";
        }
      }, 50);

      setTimeout(() => {
        if (payload !== null) {
          this.$emit(eventName, payload);
        } else {
          this.$emit(eventName);
        }

        setTimeout(() => {
          if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
          }
        }, 100);
      }, 650);
    },
    getTargetColumn() {
      const columnMap = {
        col1: "col2",
        col2: "col3",
        col3: "col4",
      };

      const targetType = columnMap[this.columnType];
      if (!targetType) return null;

      const columns = document.querySelectorAll(".column");
      for (let col of columns) {
        const h2 = col.querySelector("h2");
        if (h2) {
          const columnTypes = {
            Запланированные: "col1",
            "В работе": "col2",
            Тестирование: "col3",
            Выполненные: "col4",
          };
          if (columnTypes[h2.textContent.trim()] === targetType) {
            return col;
          }
        }
      }
      return null;
    },
    onDragStart(e) {
      if (this.columnType === "col4") {
        e.preventDefault();
        return;
      }
      const data = {
        cardId: this.card.id,
        fromColumn: this.columnType,
      };
      e.dataTransfer.setData("text/plain", JSON.stringify(data));
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setDragImage(
        this.$el,
        this.$el.offsetWidth / 2,
        this.$el.offsetHeight / 2,
      );
      setTimeout(() => {
        this.$el.classList.add("dragging");
      }, 0);
    },
    onDragEnd() {
      this.$el.classList.remove("dragging");
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
    <div class="card" :class="{ overdue: isOverdue, 'no-drag': columnType === 'col4' }"
         :draggable="columnType !== 'col4'"
         @dragstart="onDragStart"
         @dragend="onDragEnd">
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

        <div v-if="card.returnReason" style="background: rgba(255, 131, 131, 0.67); padding: 5px; margin: 5px 0;">
          Причина: {{ card.returnReason }}
        </div>

        <div style="display: flex; gap: 5px; margin-top: 8px;">
          <button v-if="columnType !== 'col4'" @click="startEdit">Редактировать</button>

          <template v-if="columnType === 'col1'">
            <button @click="animateMoveForward">Переместить дальше</button>
          </template>

          <template v-else-if="columnType === 'col2'">
            <button @click="animateMoveForward">Переместить дальше</button>
          </template>

          <template v-else-if="columnType === 'col3'">
            <button @click="animateMoveForward">Завершить задачу</button>
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
    onDeleteCard: Function,
    onMoveForward: Function,
    onMoveBack: Function,
    onCardUpdated: Function,
    onDropCard: Function,
  },
  components: {
    card: Vue.options.components["card"],
  },
  data() {
    return {
      isDragOver: false,
    };
  },
  methods: {
    onDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      this.isDragOver = true;
    },
    onDragLeave(e) {
      e.preventDefault();
      this.isDragOver = false;
    },
    onDrop(e) {
      e.preventDefault();
      this.isDragOver = false;

      const data = e.dataTransfer.getData("text/plain");

      if (data) {
        try {
          const parsed = JSON.parse(data);

          const payload = {
            cardId: parsed.cardId,
            fromColumn: parsed.fromColumn,
            toColumn: this.columnType,
          };

          this.$emit("drop-card", payload);
        } catch (err) {
          console.error("Ошибка парсинга:", err);
        }
      }
    },
  },
  template: `
    <div class="column" :class="{ 'drag-over': isDragOver }">
      <h2>{{ title }}</h2>
      <div class="cards"
           @dragover.prevent="onDragOver"
           @dragleave="onDragLeave"
           @drop="onDrop">
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

Vue.component("create-card-form", {
  data() {
    return {
      title: "",
      description: "",
      deadline: new Date().toISOString().split("T")[0],
    };
  },
  methods: {
    createCard() {
      if (!this.title.trim() || !this.description.trim()) {
        alert("Заполните заголовок и описание");
        return;
      }
      this.$emit("create", {
        title: this.title,
        description: this.description,
        deadline: this.deadline,
      });
      this.title = "";
      this.description = "";
      this.deadline = new Date().toISOString().split("T")[0];
    },
  },
  template: `
    <div class="create-form">
      <h3>Создать новую задачу</h3>
      <input v-model="title" placeholder="Заголовок" />
      <textarea v-model="description" placeholder="Описание"></textarea>
      <label>Дата дедлайна:</label>
      <input type="date" v-model="deadline" />
      <button @click="createCard">Создать задачу</button>
    </div>
  `,
});

new Vue({
  el: "#app",
  template: `
    <div class="board">
      <h1>Kanban доска</h1>
      <div class="board-content">
        <div class="sidebar">
          <create-card-form @create="addCard" />
        </div>
        <div class="columns">
          <board-column
            v-for="col in columns"
            :key="col.type"
            :title="col.title"
            :cards="getCards(col.type)"
            :column-type="col.type"
            :on-delete-card="col.type === 'col1' ? deleteCard : null"
            :on-move-forward="getMoveForward(col.type)"
            :on-move-back="col.type === 'col3' ? moveToCol2WithReason : null"
            :on-card-updated="saveToLocalStorage"
            @drop-card="handleDrop"
          />
        </div>
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
    addCard(cardData) {
      const now = new Date();
      const newCard = {
        id: this.nextId++,
        title: cardData.title,
        description: cardData.description,
        deadline: cardData.deadline,
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
    handleDrop(data) {
      const { cardId, fromColumn, toColumn } = data;

      if (!data || !cardId) {
        return;
      }

      if (fromColumn === toColumn) {
        return;
      }

      if (fromColumn === "col4") {
        return;
      }

      const fromArr = this[fromColumn];
      const toArr = this[toColumn];

      if (!fromArr || !toArr) {
        return;
      }

      const cardIndex = fromArr.findIndex((c) => c.id === cardId);

      if (cardIndex !== -1) {
        const card = fromArr[cardIndex];

        const newFromArr = fromArr.filter((c) => c.id !== cardId);
        const newToArr = [...toArr, card];

        this[fromColumn] = newFromArr;
        this[toColumn] = newToArr;
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
