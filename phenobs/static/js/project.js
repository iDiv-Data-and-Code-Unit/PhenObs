let form = document.getElementById('form');

$.ajax({
    url: "/200",
    timeout: 10000,
    error: function(jqXHR) {
        if(jqXHR.status==0) {
            form.children[4].addEventListener('click', cacheForm);
        }
    },
    success: function() {
        form.children[4].classList.remove('btn-secondary')
        form.children[4].classList.add('btn-success');
        form.children[4].value = "Save";
        loadFromCache();
    }
});

function cacheForm() {
    let multiselectSelected = [];
    let multiselectChildren = document.getElementById('multiselect').children;

    for (i = 0; i < multiselectChildren.length; i++) {
        multiselectSelected.push(multiselectChildren[i].selected);
    }

    const formData = {
        name: $('#name').val(),
        select: document.getElementById('select').selectedIndex,
        multiselect: multiselectSelected,
        textarea: $('#textarea').val()
    };

    localStorage.setItem('form', JSON.stringify(formData));
}

function loadFromCache() {
    const data = JSON.parse(localStorage.getItem('form'));
    console.log(data);

    let multiselect = document.getElementById('multiselect');

    document.getElementById('name').value = data.name;
    document.getElementById('select').selectedIndex = data.select;
    document.getElementById('textarea').value = data.textarea;

    for (let i = 0; i < data.multiselect.length; i++) {
        multiselect.children[i].selected = data.multiselect[i];
    }
}
