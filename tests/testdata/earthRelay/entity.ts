// Note that these sigs are not correct, this is only for unit testing the response from the engine.
const mockEntity = [
  {
    id: 'f0aa680eee099982d85fb5faf35eea66abeda46de7e1d3e46f36823257ab35fd',
    pubkey: '687cae10951e5c7aace29ed05e2021ba286f1a3a7dc74627330627e242f3ad8f',
    created_at: 1652765937,
    kind: 0,
    tags: [],
    content:
      '{\u0022name\u0022:\u0022test@minds.io\u0022,\u0022about\u0022:\u0022\u0022,\u0022picture\u0022:\u0022https://example.uri/icon/1373172923698778124/medium/1652765937/1652765937/1655168061\u0022}',
    sig: '244581a9a32e121c3c36e212876a8d91b5314758970903192e36eb063a9cf00b428017b88d313d44bcdcae8bbc2fce4cd50386f8d7e38bcf7aca1d7c8a383a03'
  },
  {
    id: '0fab0e0796eedea2d473166b18f9f162d4fa37c0490edeeb090a348439eda228',
    pubkey: '687cae10951e5c7aace29ed05e2021ba286f1a3a7dc74627330627e242f3ad8f',
    created_at: 1659662497,
    kind: 1,
    tags: [],
    content: 'Test post',
    sig: 'ab5de7032cf2a15aaa131e790a058315f3776bb52b100c631d73b5e701cb5d69e11dcf09836d50b5ccd6d2a29b803835ad0d113a319b8b9896077ce09e71607c'
  },
  {
    id: '747e55c3d5b316732bb0fbcaeae780f4a849b4f3174ea47a403049b5a1233921',
    pubkey: '687cae10951e5c7aace29ed05e2021ba286f1a3a7dc74627330627e242f3ad8f',
    created_at: 1661820683,
    kind: 1,
    tags: [],
    content: 'Hello world',
    sig: '5b036eb1d815a5b3a9bc3b7660173dfd17deb26e570e49e5dfdcde4e8c976cde2652c867a580d24a87b1f924f1e5db35425c3353b64ff066b4879fa237ae6226'
  }
];

export default mockEntity;
