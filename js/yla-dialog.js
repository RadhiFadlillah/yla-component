var YlaDialog = function () {
    // Private variable
    var _template = `
        <div v-if="dialogVisible" class="yla-dialog__overlay">
            <div class="yla-dialog">
                <div class="yla-dialog__header">
                    <p>{{title}}</p>
                    <a v-if="showClose" @click="handleClose">
                        <i class="fas fa-fw fa-times"></i>
                    </a>
                </div>
                <div class="yla-dialog__body">
                    <slot name="custom-body">
                        <p>{{content}}</p>
                    </slot>
                </div>
                <div class="yla-dialog__footer">
                    <slot name="custom-footer">
                        <a v-if="secondText" @click="handleSecondClick" class="yla-dialog__button">{{secondText}}</a>
                        <a @click="handleMainClick" class="yla-dialog__button main">{{mainText}}</a>
                    </slot>
                </div>
            </div>
        </div>`;

    return {
        template: _template,
        props: {
            visible: Boolean,
            title: {
                type: String,
                default: ''
            },
            showClose: {
                type: Boolean,
                default: true
            },
            content: {
                type: String,
                default: ''
            },
            mainText: {
                type: String,
                default: 'OK'
            },
            secondText: String
        },
        data: function () {
            return {
                dialogVisible: this.visible
            };
        },
        watch: {
            visible: function () {
                this.dialogVisible = this.visible;
            }
        },
        computed: {
            hasMainHandler: function () {
                return this.$listeners && this.$listeners['main-click'];
            },
            hasSecondHandler: function () {
                return this.$listeners && this.$listeners['second-click'];
            }
        },
        methods: {
            handleClose: function () {
                this.dialogVisible = false;
                this.$emit('close');
            },
            handleMainClick: function () {
                if (this.hasMainHandler) this.$emit('main-click');
                else this.dialogVisible = false;
            },
            handleSecondClick: function () {
                if (this.hasSecondHandler) this.$emit('second-click');
                else this.dialogVisible = false;
            }
        }
    };
};