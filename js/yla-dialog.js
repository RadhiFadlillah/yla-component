var YlaDialog = function () {
    // Private variable
    var _template = `
        <div v-if="visible" class="yla-dialog__overlay">
            <div class="yla-dialog">
                <div class="yla-dialog__header">
                    <p>{{title}}</p>
                </div>
                <div class="yla-dialog__body">
                    <slot name="custom-body">
                        <p class="yla-dialog__content">{{content}}</p>
                        <template v-for="(field,index) in formFields" class="yla-dialog__field">
                            <p v-if="showLabel">{{field.label}} :</p>
                            <input :style="{gridColumnEnd: showLabel ? null : 'span 2'}" 
                                   :type="fieldType(field)" 
                                   :placeholder="field.label" 
                                   :tabindex="index+1"
                                   ref="input"
                                   v-model="field.value" 
                                   @focus="$event.target.select()"
                                   @keyup.enter="handleMainClick">
                        </template>
                    </slot>
                </div>
                <div class="yla-dialog__footer">
                    <i v-if="loading" class="fas fa-fw fa-spinner fa-spin"></i>
                    <slot v-else name="custom-footer">
                        <a v-if="secondText" 
                           :tabindex="btnTabIndex+1" 
                           @click="handleSecondClick" 
                           @keyup.enter="handleSecondClick" 
                           class="yla-dialog__button">{{secondText}}
                        </a>
                        <a :tabindex="btnTabIndex" 
                           ref="mainButton"
                           @click="handleMainClick" 
                           @keyup.enter="handleMainClick" 
                           class="yla-dialog__button main">{{mainText}}
                        </a>
                    </slot>
                </div>
            </div>
        </div>`;

    return {
        template: _template,
        props: {
            visible: Boolean,
            loading: Boolean,
            title: {
                type: String,
                default: ''
            },
            content: {
                type: String,
                default: ''
            },
            fields: {
                type: Array,
                default () {
                    return []
                }
            },
            showLabel: {
                type: Boolean,
                default: false
            },
            mainText: {
                type: String,
                default: 'OK'
            },
            secondText: String,
            mainClick: {
                type: Function,
                default () {}
            },
            secondClick: {
                type: Function,
                default () {}
            }
        },
        data() {
            return {
                formFields: []
            };
        },
        computed: {
            btnTabIndex() {
                return this.fields.length + 1;
            }
        },
        watch: {
            fields: {
                immediate: true,
                handler() {
                    this.formFields = this.fields.map(field => {
                        if (typeof field === 'string') return {
                            name: field,
                            label: field,
                            value: '',
                            type: 'text',
                        }

                        if (typeof field === 'object') return {
                            name: field.name || '',
                            label: field.label || '',
                            value: field.value || '',
                            type: field.type || 'text',
                        }
                    });
                }
            }
        },
        methods: {
            fieldType(f) {
                var type = f.type || 'text';
                if (type !== 'text' && type !== 'password') return 'text';
                else return type;
            },
            handleMainClick() {
                var data = {};
                this.formFields.forEach(field => {
                    var value = field.value;
                    if (field.type === 'number') value = parseInt(value, 10) || 0;
                    else if (field.type === 'float') value = parseFloat(value) || 0.0;
                    data[field.name] = value;
                })
                this.mainClick(data);
            },
            handleSecondClick() {
                this.secondClick();
            }
        },
        updated() {
            this.$nextTick(() => {
                if (!this.visible) return;

                var fields = this.$refs.input,
                    button = this.$refs.mainButton;

                if (fields && fields.length > 0) this.$refs.input[0].focus();
                else if (button) button.focus();
            });
        }
    };
};