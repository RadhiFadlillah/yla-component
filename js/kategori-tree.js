var KategoriTree = function () {
    var _template = `
    <div class="kategori-tree">
        <a :class="className" @click="handleClick">{{kategori.nama}}</a>
        <template v-if="childVisible || containsTarget">
            <kategori-tree v-for="child in kategori.children" 
                           :key="child.id" 
                           :kategori="child"
                           :target="target"
                           :onClick="onClick">
            </kategori-tree>
        </template>
    </div>`;

    return {
        template: _template,
        props: {
            kategori: {
                type: Object,
                required: true
            },
            target: {
                type: Number,
                default: -1
            },
            onClick: {
                type: Function,
                default () {}
            }
        },
        data() {
            return {
                childVisible: false
            };
        },
        computed: {
            className() {
                return {
                    'has-child': this.kategori.children.length > 0,
                    expanded: this.childVisible
                }
            },
            containsTarget() {
                var children = this.kategori.children;
                for (var i = 0; i < children.length; i++) {
                    if (this.target !== -1 && children[i].id === this.target) {
                        return true;
                    }
                }

                return false;
            }
        },
        methods: {
            handleClick() {
                if (this.kategori.children.length > 0) {
                    this.childVisible = !this.childVisible;
                } else {
                    this.onClick(this.kategori);
                }
            }
        }
    };
};